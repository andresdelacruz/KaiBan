import { config } from 'dotenv';
config();

import '@/ai/flows/draft-card-from-prompt-flow.ts';
import '@/ai/flows/refine-card-description-flow.ts';
import '@/ai/flows/assess-evidence-relevance.ts';