import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChatIcon } from '../components/icons';

export const Route = createFileRoute('/_app/social/mensajes/')({ component: NoConversationSelected });

/** Estado vacío de la columna derecha cuando aún no se ha abierto ninguna conversación. */
function NoConversationSelected() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-tb-muted">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tb-surface-2">
        <ChatIcon />
      </span>
      <p className="text-sm">{t('messages.selectConversation')}</p>
    </div>
  );
}
