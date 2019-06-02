import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
import * as fs from 'browserify-fs'
import * as Papa from 'papaparse'

let vocabDict
const speech = new Speech()
const file = fs.createReadStream("HSK 5.csv")
let count = 0 // cache the running count
Papa.parse(file, {
  worker: true, // Don't bog down the main thread if it's a big file
  step: result => {
    vocabDict = result
  },
  complete: (results, file) => {
    console.log('parsing complete read', count, 'records.'); 
  }
})

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const randomKey = dict => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(dict)
    if (keys === null || keys === [])
      reject(new Error("Keys is null or empty"))
    resolve(keys[keys.length * Math.random() << 0])
  })
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      play: true
    }
    if (speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    speech.init().then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing: ", err)
    })
  }
  
  render() {
    for (let i = 0; i < 100; i++) {
      (async () => {
        const key = await randomKey(vocabDict)
        await speech.speak({ text: key })
        // TODO: set TTS language so that it can read Chinese text
        // TODO: figure out why nothing else in the loop runs after the first speech.speak
        await sleep(500)
        await speech.speak({ text: vocabDict[key] })
      })()
    }

    return (
      <div className="App">
        <header className="App-header">
          <h1>Not Glossika</h1>
        </header>
      </div>
    );
  }
}

export default App;