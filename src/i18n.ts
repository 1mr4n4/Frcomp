import type { InputKeyword, Lang } from './engine/interpreter'

export const UI = {
  fr: {
    title: 'Pseudo-code Studio', run: 'Exécuter', stop: 'Arrêter', clear: 'Effacer la console',
    settings: 'Paramètres', language: 'Langue', inputSyntax: 'Mot-clé de saisie',
    inputDisabled: 'Non applicable en anglais', editor: 'Éditeur', console: 'Console',
    editorPlaceholder: 'Écrivez votre algorithme ici…', inputPlaceholder: 'Votre réponse…',
    send: 'Envoyer', done: '— Programme terminé —', stopped: '— Exécution interrompue —',
    idle: 'Cliquez sur « Exécuter » pour lancer le programme.',
  },
  en: {
    title: 'Pseudo-code Studio', run: 'Run', stop: 'Stop', clear: 'Clear console',
    settings: 'Settings', language: 'Language', inputSyntax: 'Input keyword',
    inputDisabled: 'Not applicable in English', editor: 'Editor', console: 'Console',
    editorPlaceholder: 'Write your algorithm here…', inputPlaceholder: 'Your answer…',
    send: 'Send', done: '— Program finished —', stopped: '— Execution stopped —',
    idle: 'Click "Run" to start the program.',
  },
}

export function example(lang: Lang, kw: InputKeyword): string {
  if (lang === 'fr') {
    return `Algorithme Bonjour
Variables
  nom : chaine
  age : entier
debut
  Afficher("Quel est votre nom ?")
  ${kw}(nom)
  Afficher("Quel est votre age ?")
  ${kw}(age)
  Si age >= 18 Alors
    Afficher("Bonjour ", nom, ", vous etes majeur.")
  Sinon
    Afficher("Bonjour ", nom, ", vous etes mineur.")
  FinSi
  Pour i de 1 a 3
    Afficher("Compteur : ", i)
  FinPour
Fin
`
  }
  return `Algorithm Hello
Variables
  name : string
  age : integer
Start
  Print("What is your name?")
  Input(name)
  Print("How old are you?")
  Input(age)
  If age >= 18 Then
    Print("Hello ", name, ", you are an adult.")
  Else
    Print("Hello ", name, ", you are a minor.")
  EndIf
  For i from 1 to 3
    Print("Counter: ", i)
  EndFor
End
`
}
