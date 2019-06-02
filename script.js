import Speech from 'speak-tts'
import 'babel-polyfill'

const vocabDict = {
  "hi": "hello",
  "now": "newt",
  "yo": "what"
}

const speech = new Speech()
if (speech.hasBrowserSupport())
  console.log("Speech synthesis supported by browser")
speech.init().then(data => {
  console.log("Speech is ready, voices are available", data)
}).catch(e => {
  console.log("An error occurred while initializing: ", e)
})

const start = async () => {
  for (const [key, value] of Object.defineProperties(vocabDict)) {
    await speech.speak({
      text: key
    })
    await speech.speak({
      text: value
    })
  }
}

$(document).ready(() => {
  start()
})