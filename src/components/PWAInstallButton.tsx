import {useState} from 'react';
import {Download} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';
import type {TranslationDictionary} from '../i18n/translations';

interface PWAInstallButtonProps {
  compact?: boolean;
  t: TranslationDictionary;
}

export function PWAInstallButton({compact = false, t}: PWAInstallButtonProps) {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        title={t.pwa.installBtn}
        className={`aer-btn-primary inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
          compact ? 'w-10 h-10 p-0' : 'w-full h-10 px-3.5'
        }`}
      >
        <Download className="w-4 h-4 shrink-0" />
        {!compact && <span className="truncate">{t.pwa.installShort}</span>}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          title={t.pwa.installBtn}
          className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--glass-subtle-bg)] border border-[var(--line)] hover:border-[var(--pink)] text-xs font-medium text-[var(--text)] transition-colors whitespace-nowrap ${
            compact ? 'w-10 h-10 p-0' : 'w-full h-10 px-3.5'
          }`}
        >
          <Download className="w-4 h-4 shrink-0 text-[var(--pink)]" />
          {!compact && <span className="truncate">{t.pwa.installShort}</span>}
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-md p-4">
            <div className="glass-panel-elevated rounded-2xl w-full max-w-sm p-6 space-y-4 text-[var(--text)]">
              <h3 className="font-display font-bold text-lg">{t.pwa.iosTitle}</h3>
              <ol className="space-y-2 text-sm text-[var(--text-secondary)] list-decimal pl-4">
                <li>{t.pwa.iosStep1}</li>
                <li>{t.pwa.iosStep2}</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-10 rounded-xl aer-btn-primary text-sm font-medium"
              >
                {t.pwa.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
