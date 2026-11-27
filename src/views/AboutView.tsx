import type { Meta } from '../data';
import { useLang, useT } from '../i18n';
import { useNav } from '../nav';
import { AppBar, SponsorSlot } from '../components';
import { IconSchool } from '../icons';
import { SPONSOR_TIERS } from '../sponsors';

export default function AboutView({ meta }: { meta: Meta }) {
  const { t, n, date } = useT();
  const { lang, setLang } = useLang();
  const go = useNav();
  const maxAcc = Math.max(...meta.years.map((y) => y.accidents));
  return (
    <>
    <AppBar />
    <div className="page about">
      <div className="eyebrow">{t({ cs: 'O aplikaci', en: 'About' })}</div>
      <h1>{t({ cs: 'Černý humor. Skutečná data.', en: 'Dark humour. Real data.' })}</h1>
      <p>
        {t({
          cs: 'Dopravní nehody v Česku ze skutečných dat Policie ČR. Smyslem není strašit, ale ukázat, co lidi na silnicích opravdu zabíjí – a že většině z toho jde předejít.',
          en: 'Road crashes in Czechia from real Czech Police data. The point is not to scare you but to show what actually kills people on the roads – and that most of it is preventable.',
        })}
      </p>

      <div className="lang-switch">
        <button className={`chip ${lang === 'cs' ? 'on' : ''}`} onClick={() => setLang('cs')}>Čeština</button>
        <button className={`chip ${lang === 'en' ? 'on' : ''}`} onClick={() => setLang('en')}>English</button>
      </div>

      <div className="tiles" style={{ marginTop: 12 }}>
        <button className="tile wide yellow" onClick={() => go('edu')}>
          <div className="tile-icon"><IconSchool /></div>
          <div style={{ flex: 1 }}>
            <b>{t({ cs: 'Pro školy, autoškoly a Policii ČR', en: 'For schools, driving schools & Police' })}</b>
            <span>{t({ cs: 'Výukový režim bez černého humoru, 45min metodika a tisknutelná fakta', en: 'Classroom mode without dark humour, 45-min lesson plan & printable facts' })}</span>
          </div>
        </button>
      </div>

      <h2>{t({ cs: 'Partnerství & sponzoring', en: 'Partnerships & sponsorship' })}</h2>
      <SponsorSlot />
      <div className="panel" style={{ marginTop: 10 }}>
        {SPONSOR_TIERS.map((tier) => (
          <div className="tier-row" key={tier.id}>
            <b>{t(tier.title)}</b>
            <div className="muted small">{t(tier.desc)}</div>
          </div>
        ))}
      </div>

      <h2>{t({ cs: 'Data', en: 'Data' })}</h2>
      <div>
        {meta.years.map((y) => (
          <div className="year-row" key={y.year}>
            <b className="display">{y.year}</b>
            <div>
              <div className="bar" style={{ width: `${(100 * y.accidents) / maxAcc}%` }} />
              <span className="small muted">
                {n(y.accidents)} {t({ cs: 'nehod', en: 'crashes' })}
                {!y.complete && ` · ${t({ cs: 'do', en: 'until' })} ${date(y.lastDate)}`}
              </span>
            </div>
            <b className="c-red">{n(y.killed)} {t({ cs: 'mrtvých', en: 'dead' })}</b>
          </div>
        ))}
      </div>
      <p className="muted small">
        {t({ cs: 'Zdroj', en: 'Source' })}:{' '}
        <a href="https://policie.gov.cz/statistiky-dopravni-nehodovosti" target="_blank" rel="noreferrer">
          Policie ČR – {t({ cs: 'Statistiky dopravní nehodovosti', en: 'Road accident statistics' })}
        </a>
        . {t({ cs: 'Aktualizováno', en: 'Updated' })} {date(meta.generatedAt.slice(0, 10))}. {t({ cs: 'Data se stahují automaticky každý týden.', en: 'Data is refreshed automatically every week.' })}
      </p>
      <h2>{t({ cs: 'Důležité poznámky', en: 'Important notes' })}</h2>
      <ul className="facts">
        <li>{t({ cs: 'Mrtví = zemřelí do 24 hodin od nehody (tak to eviduje policie u každé nehody). Oficiální roční statistiky počítají 30 dní, proto jsou o něco vyšší.', en: 'Dead = died within 24 hours of the crash (as recorded per accident). Official annual figures use 30 days and are therefore slightly higher.' })}</li>
        <li>{t({ cs: 'Mapa ukazuje jen nehody se zraněním. Nehody jen s hmotnou škodou jsou ve statistikách, ne v mapě.', en: 'The map shows injury crashes only. Damage-only crashes are in the statistics, not on the map.' })}</li>
        <li>{t({ cs: 'Policie zveřejňuje surová data od roku 2023. Starší roky existují jen jako PDF ročenky.', en: 'Police publish raw records from 2023 onwards. Older years exist only as PDF yearbooks.' })}</li>
        <li>{t({ cs: 'Počty obyvatel krajů jsou přibližné (ČSÚ, 2025).', en: 'Region populations are approximate (Czech Statistical Office, 2025).' })}</li>
      </ul>
      <h2>{t({ cs: 'K tomu humoru', en: 'About the humour' })}</h2>
      <p>
        {t({
          cs: 'Černý humor je tu proto, aby si fakta člověk zapamatoval. Vtipkujeme o chování – rychlosti, telefonech, alkoholu, sebevědomí. Nikdy o lidech, kteří zemřeli. U konkrétních nehod v mapě vtipy nejsou.',
          en: 'The dark humour is there to make the facts stick. We joke about behaviour – speed, phones, alcohol, overconfidence. Never about the people who died. There are no jokes on individual crashes in the map.',
        })}
      </p>
      <p className="muted">
        {t({
          cs: 'Pokud tě nehoda zasáhla osobně, pomoc nabízí Bílý kruh bezpečí, linka 116 006 (nonstop, zdarma).',
          en: 'If a crash has affected you personally, Bílý kruh bezpečí offers support on 116 006 (24/7, free, Czech).',
        })}
      </p>
    </div>
    </>
  );
}
