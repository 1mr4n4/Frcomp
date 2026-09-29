import type { InputKeyword, Lang } from './engine/interpreter'

export const UI = {
  fr: {
    title: 'Pseudo-code Studio', subtitle: 'Interpréteur de pseudo-code interactif',
    run: 'Exécuter', stop: 'Arrêter', clear: 'Effacer la console',
    settings: 'Paramètres', language: 'Langue', inputSyntax: 'Mot-clé de saisie',
    inputDisabled: 'Non applicable en anglais', editor: 'Éditeur', console: 'Console',
    editorPlaceholder: 'Écrivez votre algorithme ici…', inputPlaceholder: 'Votre réponse…',
    send: 'Envoyer', done: '— Programme terminé —', stopped: '— Exécution interrompue —',
    idle: 'Cliquez sur « Exécuter » pour lancer le programme.',
    copy: 'Copier', copied: 'Copié', reset: 'Exemple',
    statusReady: 'Prêt', statusRunning: 'Exécution', statusWait: 'Saisie', statusError: 'Erreur',
    writing: 'le programme écrit…', waitingInput: 'en attente d’une saisie…',
    linesLabel: 'lignes', charsLabel: 'car.', shortcut: 'Ctrl + Entrée',
    enterHint: 'Entrée pour valider',
  },
  en: {
    title: 'Pseudo-code Studio', subtitle: 'Interactive pseudo-code interpreter',
    run: 'Run', stop: 'Stop', clear: 'Clear console',
    settings: 'Settings', language: 'Language', inputSyntax: 'Input keyword',
    inputDisabled: 'Not applicable in English', editor: 'Editor', console: 'Console',
    editorPlaceholder: 'Write your algorithm here…', inputPlaceholder: 'Your answer…',
    send: 'Send', done: '— Program finished —', stopped: '— Execution stopped —',
    idle: 'Click "Run" to start the program.',
    copy: 'Copy', copied: 'Copied', reset: 'Example',
    statusReady: 'Ready', statusRunning: 'Running', statusWait: 'Input', statusError: 'Error',
    writing: 'program writing…', waitingInput: 'waiting for input…',
    linesLabel: 'lines', charsLabel: 'chars', shortcut: 'Ctrl + Enter',
    enterHint: 'Enter to submit',
  },
}

export type UIStrings = typeof UI.fr

export function example(lang: Lang, kw: InputKeyword): string {
  if (lang === 'fr') {
    return `Algorithme Exemple
Variables
  A : entier
  B : entier
debut
  A <- 5
  B <- A * 2
  Afficher("A = ", A)
  Afficher("B = ", B)
  Afficher("Somme : ", A + B)
Fin
`
  }
  return `Algorithm Example
Variables
  A : integer
  B : integer
Start
  A <- 5
  B <- A * 2
  Print("A = ", A)
  Print("B = ", B)
  Print("Sum: ", A + B)
End
`
}
