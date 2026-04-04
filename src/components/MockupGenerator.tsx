import { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface MockupGeneratorProps {
  pageName: string;
  promptDescription: string;
}

export function MockupGenerator({ pageName, promptDescription }: MockupGeneratorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMockup = async () => {
    setLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta.env.VITE_GEMINI_API_KEY || "") });
      const prompt = `A highly realistic, professional UI/UX mockup of a modern CRM ${pageName}. ${promptDescription}. Elegant premium modern theme, clean background, distinct cards, vibrant accents, minimalist geometric icons, professional and sober. Clean, sleek, dribbble style.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setImageUrl(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }
      if (!foundImage) {
        throw new Error('No image generated');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate mockup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 md:mt-12 p-6 md:p-8 bg-bg-card border border-border-color rounded-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
        <div>
          <h3 className="text-lg md:text-xl font-semibold text-primary flex items-center gap-2 mb-1 uppercase tracking-wider whitespace-nowrap">
            <ImageIcon size={20} />
            Gerar Mockup com IA
          </h3>
          <p className="text-sm text-text-sec">Gere uma visão conceitual premium desta tela usando Nano Banana.</p>
        </div>
        <button
          onClick={generateMockup}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-grad-start to-grad-end hover:from-primary hover:to-secondary text-[var(--text-on-grad)] rounded-lg font-bold transition-all disabled:opacity-50 disabled:hover:from-grad-start disabled:hover:to-grad-end flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-primary/10"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
          {loading ? 'GERANDO...' : 'GERAR MOCKUP'}
        </button>
      </div>
      
      {error && <div className="text-primary text-sm mb-4 bg-primary/10 p-4 rounded-lg border border-primary/20">{error}</div>}
      
      {imageUrl && (
        <div className="mt-6 rounded-lg overflow-hidden border border-border-color">
          <img src={imageUrl} alt={`Mockup ${pageName}`} className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
}
