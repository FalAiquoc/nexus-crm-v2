/**
 * Motor de Execução de Automações
 * Executa workflows definidos como JSON (trigger -> actions)
 * Integrado com Evolution API para ações de WhatsApp
 */

import db from '../db';
import { evolutionService } from './evolution.service';

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'delay' | 'chain';
  title: string;
  description: string;
  icon: string;
  config?: Record<string, any>;
  targetWorkflowId?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger_name: string;
  status: 'active' | 'paused';
  steps: WorkflowStep[];
  user_id: string;
  integration_config?: {
    instance_id?: string;
    instance_name?: string;
    api_key?: string;
  };
}

export interface TriggerData {
  type: string;
  payload: Record<string, any>;
  timestamp: string;
}

interface ExecutionContext {
  automationId: string;
  triggerData: TriggerData;
  variables: Map<string, any>;
  stepsExecuted: number;
  stepsTotal: number;
}

export class AutomationEngine {
  private static instance: AutomationEngine;
  private executionQueue: Array<{ rule: AutomationRule; triggerData: TriggerData }> = [];
  private isProcessing = false;

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  /**
   * Enfileira uma automação para execução
   */
  async queueExecution(rule: AutomationRule, triggerData: TriggerData): Promise<void> {
    console.log(`📥 [AUTOMATION] Enfileirando: ${rule.name} | Trigger: ${triggerData.type}`);
    
    this.executionQueue.push({ rule, triggerData });
    
    // Inicia processamento se não estiver rodando
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Processa a fila de execução
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.executionQueue.length > 0) {
      const { rule, triggerData } = this.executionQueue.shift()!;
      
      try {
        await this.executeAutomation(rule, triggerData);
      } catch (error: any) {
        console.error(`❌ [AUTOMATION] Erro na execução: ${rule.name}`, error);
        await this.logExecution(rule.id, triggerData, 0, rule.steps.length, error.message);
      }
    }

    this.isProcessing = false;
    console.log('✅ [AUTOMATION] Fila de execução processada');
  }

  /**
   * Executa uma regra de automação completa
   */
  private async executeAutomation(rule: AutomationRule, triggerData: TriggerData): Promise<void> {
    console.log(`🚀 [AUTOMATION] Executando: ${rule.name}`);

    const context: ExecutionContext = {
      automationId: rule.id,
      triggerData,
      variables: new Map(),
      stepsExecuted: 0,
      stepsTotal: rule.steps.length
    };

    // Inicializa variáveis de contexto
    context.variables.set('trigger_type', triggerData.type);
    context.variables.set('trigger_payload', triggerData.payload);
    context.variables.set('timestamp', triggerData.timestamp);

    // Cria log de execução
    const executionLogId = Math.random().toString(36).substr(2, 9);
    await db.prepare(
      `INSERT INTO automation_logs (id, automation_id, trigger_data, execution_status, steps_executed, steps_total, started_at)
       VALUES ($1, $2, $3, 'running', 0, $4, $5)`
    ).run(executionLogId, rule.id, JSON.stringify(triggerData), rule.steps.length, new Date().toISOString());

    let stepsExecuted = 0;

    try {
      // Executa cada step do workflow
      for (let i = 0; i < rule.steps.length; i++) {
        const step = rule.steps[i];
        
        // Pula o trigger (é apenas descritivo)
        if (step.type === 'trigger') {
          stepsExecuted++;
          continue;
        }

        console.log(`⚙️ [AUTOMATION] Executando step ${i + 1}/${rule.steps.length}: ${step.title}`);
        
        await this.executeStep(step, context);
        stepsExecuted++;

        // Atualiza log de progresso
        await db.prepare(
          `UPDATE automation_logs SET steps_executed = $1 WHERE id = $2`
        ).run(stepsExecuted, executionLogId);
      }

      // Finaliza com sucesso
      await db.prepare(
        `UPDATE automation_logs SET execution_status = 'completed', steps_executed = $1, completed_at = $2 WHERE id = $3`
      ).run(stepsExecuted, new Date().toISOString(), executionLogId);

      // Atualiza última execução da regra
      await db.prepare(
        `UPDATE automation_rules SET last_run = $1 WHERE id = $2`
      ).run(new Date().toISOString(), rule.id);

      console.log(`✅ [AUTOMATION] Concluída: ${rule.name} (${stepsExecuted} steps)`);

    } catch (error: any) {
      // Finaliza com erro
      await db.prepare(
        `UPDATE automation_logs SET execution_status = 'failed', steps_executed = $1, error_message = $2, completed_at = $3 WHERE id = $4`
      ).run(stepsExecuted, error.message, new Date().toISOString(), executionLogId);

      throw error;
    }
  }

  /**
   * Executa um único step do workflow
   */
  private async executeStep(step: WorkflowStep, context: ExecutionContext): Promise<void> {
    const config = step.config || {};

    switch (step.type) {
      case 'action':
        await this.executeAction(step, config, context);
        break;

      case 'condition':
        await this.executeCondition(step, config, context);
        break;

      case 'delay':
        await this.executeDelay(step, config, context);
        break;

      case 'chain':
        await this.executeChain(step, config, context);
        break;

      default:
        console.warn(`⚠️ [AUTOMATION] Tipo de step desconhecido: ${step.type}`);
    }
  }

  /**
   * Executa uma ação (enviar WhatsApp, email, etc.)
   */
  private async executeAction(
    step: WorkflowStep,
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<void> {
    const actionType = config.action_type || step.description.toLowerCase();

    // AÇÃO: Enviar WhatsApp
    if (actionType.includes('whatsapp') || actionType.includes('mensagem')) {
      const instanceName = config.instance_name || process.env.EVOLUTION_INSTANCE_NAME;
      const apiKey = config.api_key || process.env.EVOLUTION_INSTANCE_API_KEY;
      const phoneNumber = this.resolveVariable(config.phone_number, context);
      const message = this.resolveVariable(config.message, context);

      if (!instanceName || !apiKey) {
        throw new Error('Configuração de instância WhatsApp não encontrada');
      }

      if (!phoneNumber) {
        throw new Error('Número de telefone não encontrado no contexto');
      }

      console.log(`📱 [WHATSAPP] Enviando mensagem para ${phoneNumber}`);

      await evolutionService.sendTextMessage(
        { instanceName, apiKey },
        {
          number: phoneNumber,
          text: message || 'Mensagem padrão',
          options: {
            delay: config.delay || 1000,
            presence: 'composing'
          }
        }
      );

      // Registra mensagem no banco
      const msgId = Math.random().toString(36).substr(2, 9);
      await db.prepare(
        `INSERT INTO whatsapp_messages (id, instance_id, direction, phone_number, message_type, content, status, created_at)
         VALUES ($1, $2, 'outbound', $3, 'text', $4, 'sent', $5)`
      ).run(msgId, instanceName, phoneNumber, message, new Date().toISOString());
    }

    // AÇÃO: Enviar Email (placeholder para integração futura)
    else if (actionType.includes('email')) {
      console.log(`📧 [EMAIL] Simulação de envio de email`);
      // TODO: Integrar com serviço de email (SendGrid, AWS SES, etc.)
    }

    // AÇÃO: Atualizar Lead
    else if (actionType.includes('atualizar lead') || actionType.includes('update lead')) {
      const leadId = this.resolveVariable(config.lead_id, context);
      const updates = config.updates || {};

      if (leadId) {
        const setClause = Object.keys(updates)
          .map((key, idx) => `${key} = $${idx + 1}`)
          .join(', ');
        const values = Object.values(updates);

        await db.prepare(
          `UPDATE leads SET ${setClause} WHERE id = $${values.length + 1}`
        ).run(...values, leadId);
      }
    }

    // AÇÃO: Criar Tag
    else if (actionType.includes('tag')) {
      console.log(`🏷️ [TAG] Adicionando tag: ${config.tag_name}`);
      // TODO: Implementar sistema de tags
    }

    // AÇÃO: Notificação Interna
    else if (actionType.includes('notificação') || actionType.includes('notific')) {
      console.log(`🔔 [NOTIFICATION] Notificação interna: ${config.message}`);
      // TODO: Implementar sistema de notificações
    }

    else {
      console.warn(`⚠️ [AUTOMATION] Ação não implementada: ${actionType}`);
    }
  }

  /**
   * Executa uma condição (if/else)
   */
  private async executeCondition(
    step: WorkflowStep,
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<void> {
    const condition = config.condition;
    
    // Exemplo: "lead_status == 'Novo Lead'"
    if (condition) {
      const [left, operator, right] = condition.split(' ');
      const leftValue = this.resolveVariable(left, context);
      const rightValue = this.resolveVariable(right, context);

      let result = false;
      switch (operator) {
        case '==': result = leftValue === rightValue; break;
        case '!=': result = leftValue !== rightValue; break;
        case '>': result = Number(leftValue) > Number(rightValue); break;
        case '<': result = Number(leftValue) < Number(rightValue); break;
        case '>=': result = Number(leftValue) >= Number(rightValue); break;
        case '<=': result = Number(leftValue) <= Number(rightValue); break;
      }

      context.variables.set(`condition_${step.id}`, result);
      console.log(`🔍 [CONDITION] ${condition} = ${result}`);
    }
  }

  /**
   * Executa um delay (espera)
   */
  private async executeDelay(
    step: WorkflowStep,
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<void> {
    const delayMs = this.resolveVariable(config.duration_ms || config.duration_seconds * 1000, context);
    
    console.log(`⏳ [DELAY] Aguardando ${delayMs}ms`);
    await new Promise(resolve => setTimeout(resolve, Number(delayMs)));
  }

  /**
   * Executa chain (chama outro workflow)
   */
  private async executeChain(
    step: WorkflowStep,
    config: Record<string, any>,
    context: ExecutionContext
  ): Promise<void> {
    const targetWorkflowId = config.targetWorkflowId || step.targetWorkflowId;
    
    if (!targetWorkflowId) {
      throw new Error('targetWorkflowId não especificado no step chain');
    }

    // Busca o workflow alvo
    const targetRule = await db.prepare(
      `SELECT * FROM automation_rules WHERE id = $1 OR name = $2`
    ).get(targetWorkflowId, targetWorkflowId);

    if (!targetRule) {
      throw new Error(`Workflow alvo não encontrado: ${targetWorkflowId}`);
    }

    console.log(`🔗 [CHAIN] Chamando workflow: ${targetRule.name}`);

    // Enfileira o workflow alvo
    await this.queueExecution(targetRule, context.triggerData);
  }

  /**
   * Resolve variáveis no formato {{variable_name}}
   */
  private resolveVariable(value: any, context: ExecutionContext): any {
    if (typeof value !== 'string') return value;

    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const resolved = context.variables.get(varName);
      return resolved !== undefined ? String(resolved) : match;
    });
  }

  /**
   * Registra log de execução
   */
  private async logExecution(
    automationId: string,
    triggerData: TriggerData,
    stepsExecuted: number,
    stepsTotal: number,
    errorMessage: string
  ): Promise<void> {
    try {
      await db.prepare(
        `INSERT INTO automation_logs (id, automation_id, trigger_data, execution_status, steps_executed, steps_total, error_message, started_at, completed_at)
         VALUES ($1, $2, $3, 'failed', $4, $5, $6, $7, $8)`
      ).run(
        Math.random().toString(36).substr(2, 9),
        automationId,
        JSON.stringify(triggerData),
        stepsExecuted,
        stepsTotal,
        errorMessage,
        new Date().toISOString(),
        new Date().toISOString()
      );
    } catch (error) {
      console.error('❌ [AUTOMATION] Falha ao registrar log:', error);
    }
  }

  /**
   * Disparador: Novo Lead Criado
   */
  async triggerLeadCreated(leadId: string): Promise<void> {
    const lead = await db.prepare(`SELECT * FROM leads WHERE id = $1`).get(leadId);
    
    if (!lead) return;

    const rules = await db.prepare(
      `SELECT * FROM automation_rules WHERE trigger_name LIKE '%Lead Criado%' OR trigger_name LIKE '%Novo Lead%' AND status = 'active'`
    ).all();

    for (const rule of rules) {
      await this.queueExecution(rule, {
        type: 'lead_created',
        payload: { lead_id: leadId, lead },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Disparador: Mensagem WhatsApp Recebida
   */
  async triggerWhatsAppMessageReceived(instanceName: string, phoneNumber: string, message: string): Promise<void> {
    const rules = await db.prepare(
      `SELECT * FROM automation_rules WHERE trigger_name LIKE '%WhatsApp%' OR trigger_name LIKE '%Mensagem Recebida%' AND status = 'active'`
    ).all();

    for (const rule of rules) {
      await this.queueExecution(rule, {
        type: 'whatsapp_message_received',
        payload: { instance_name: instanceName, phone_number: phoneNumber, message },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Disparador: Status de Lead Alterado
   */
  async triggerLeadStatusChanged(leadId: string, oldStatus: string, newStatus: string): Promise<void> {
    const lead = await db.prepare(`SELECT * FROM leads WHERE id = $1`).get(leadId);
    
    if (!lead) return;

    const rules = await db.prepare(
      `SELECT * FROM automation_rules WHERE trigger_name LIKE '%Status%' AND status = 'active'`
    ).all();

    for (const rule of rules) {
      await this.queueExecution(rule, {
        type: 'lead_status_changed',
        payload: { lead_id: leadId, old_status: oldStatus, new_status: newStatus, lead },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const automationEngine = AutomationEngine.getInstance();
