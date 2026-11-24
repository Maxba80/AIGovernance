# Knowledge Base — AI Governance Tool

Base di conoscenza normativa dell'applicazione AI GRC. Generata il 24 novembre 2026.
I dati strutturati sono in inglese (lingua delle fonti); etichette e titoli dei template hanno anche l'italiano.

## Principio: trasparenza e tracciabilità

Ogni file JSON inizia con un blocco `_meta` che dichiara:

- `source_ids`: le fonti da cui deriva, definite in `sources/manifest.json`;
- `licence`: la licenza del contenuto;
- `extraction`: come è stato prodotto (estrazione automatica dal testo ufficiale, conversione da dataset, oppure **scritto dall'AI**);
- `verification`: quanto è stato verificato, e contro cosa.

Ogni record normativo ha un `id` stabile e un campo `citation` con il riferimento puntuale (articolo, clausola, controllo).
`INDEX.json` contiene l'hash SHA-256 di ogni file della KB; `sources/manifest.json` contiene l'hash di ogni fonte scaricata.
Gli script in `_build/` rigenerano tutto dalle fonti: il risultato è riproducibile.

## Struttura

| Cartella | Contenuto | Origine |
|---|---|---|
| `frameworks/eu_ai_act/articles.json` | 113 articoli e 13 allegati (testo 2024), 6 articoli nuovi e 43 modifiche del Reg. 2026/1744 | Estratto dai PDF della GU |
| `frameworks/eu_ai_act/classification_roles_timeline.json` | Classi di rischio, albero decisionale, ruoli e obblighi, scadenze, sanzioni, registro delle linee guida | Scritto dall'AI, con articoli citati |
| `frameworks/gdpr/articles.json` | 99 articoli, testo integrale | Estratto dal PDF della GU |
| `frameworks/gdpr/ai_relevant_articles.json` | 30 articoli rilevanti per l'AI, con testo e nota di rilevanza | Testo dalla GU; note scritte dall'AI |
| `frameworks/iso_42001/requirements.json` | 27 clausole (4–10) e 38 controlli Annex A con procedura di audit ed evidenze tipiche | PDF ISO su licenza + guida di studio |
| `frameworks/nist_ai_rmf/core.json` | 72 sottocategorie di AI RMF 1.0 | Estratto dal PDF NIST |
| `frameworks/nist_ai_rmf/genai_profile_600-1.json` | 12 rischi GenAI e 212 azioni suggerite | NIST AI 600-1 via IBM ai-atlas-nexus |
| `frameworks/gartner/ai_maturity_and_trism.json` | Modello di maturità AI (5 livelli) e AI TRiSM | Sintesi scritta dall'AI, non verificata |
| `risk-taxonomy/` | MIT AI Risk Repository v4 (tassonomie e database completo), tassonomia delle mitigazioni MIT, IBM AI Risk Atlas (99 rischi, inclusi quelli agentici), OWASP Top 10 LLM 2025 e Agentic 2026 | Fonti ufficiali / ai-atlas-nexus |
| `crosswalks/common_control_objectives.json` | 27 obiettivi di controllo comuni che collegano AI Act, GDPR, ISO 42001 e NIST | **Scritto dall'AI, da validare** |
| `crosswalks/framework_edges.json` | Archi a coppie tra requisiti, derivati dagli obiettivi comuni (per il grafo) | Derivato |
| `crosswalks/risk/` | Mapping tra tassonomie di rischio (IBM, MIT, NIST, OWASP) e da rischi MIT a obiettivi di controllo | ai-atlas-nexus; l'ultimo scritto dall'AI |
| `templates/` | 31 template di deliverable in Markdown; `_REVIEW_NOTES.md` elenca cosa è stato verificato e cosa no | Scritti dall'AI |
| `checklists/` | 123 domande della guida di studio Lead Auditor | Estratte dall'HTML |
| `sources/` | `manifest.json` e copie delle fonti pubbliche scaricate | — |
| `_build/` | Script di generazione | — |

## Come funziona "Assess Once, Comply Many"

Ogni obiettivo di controllo comune (`CCO-01` … `CCO-27`) raggruppa i requisiti dei quattro framework che la stessa evidenza può soddisfare, con forza del legame `primary` o `supporting`, le evidenze tipiche e i deliverable collegati. Quando un documento caricato viene associato a un obiettivo, lo stato di conformità si aggiorna su tutti i requisiti collegati.

## Limiti noti — da leggere prima dell'uso

1. **AI Act non consolidato.** `articles.json` contiene il testo originale del 2024 più le 43 istruzioni di modifica del Regolamento (UE) 2026/1744, testuali e collegate agli articoli toccati (campo `amendments`). Il testo aggiornato è ricostruito solo dove un articolo intero è stato sostituito (Art. 4). I nuovi articoli 4a, 60a, 75a–75d sono inclusi. Le scadenze in `classification_roles_timeline.json` sono verificate sul testo della GU.
2. **GDPR.** `frameworks/gdpr/articles.json` contiene i 99 articoli dal testo della GU del 2016 (senza considerando, senza rettifiche successive). Le note di rilevanza per l'AI sono scritte dall'AI.
3. **Crosswalk non ufficiale.** Gli obiettivi di controllo comuni sono un lavoro dell'AI: l'esistenza di ogni requisito citato è controllata automaticamente, la correttezza semantica no. Ogni voce ha `validation_status: draft`.
4. **Testi ISO su licenza monoutente.** Nel repository pubblico `frameworks/iso_42001/requirements.json` contiene solo identificativi, titoli e sintesi scritte dall'AI. L'edizione completa con il testo dei controlli e le procedure di audit (`requirements.licensed.json`) e le domande del corso (`checklists/`) restano solo su Drive e in locale: uso personale del titolare della licenza, non redistribuire.
5. **Estrazione automatica.** Il testo delle sottocategorie NIST e dei controlli ISO viene da tabelle PDF: va confrontato con l'originale prima di citarlo testualmente in un deliverable.
6. **Gartner.** Sintesi da conoscenza del modello, non verificata sulle pubblicazioni Gartner.
7. **OWASP LLM.** Gli identificativi sono dell'edizione 2025; fonti secondarie segnalano un'edizione 2026.

## Azioni richieste al proprietario

Nessun documento mancante. Da fare: validare gli obiettivi di controllo comuni e rivedere i template (vedi `templates/_REVIEW_NOTES.md`).
