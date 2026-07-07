import { Camera, Feather, PenLine, ScrollText, Stamp, Users, type LucideIcon } from "lucide-react";

export const serviceIcons: Record<string, LucideIcon> = {
  escrituras: ScrollText,
  procuracoes: Users,
  "reconhecimento-de-firma": PenLine,
  autenticacoes: Stamp,
  testamentos: Feather,
  "atas-notariais": Camera,
};
