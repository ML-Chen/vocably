import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
import fs from 'fs'
import * as Papa from 'papaparse'

const vocabDict = {
  "hi": "hello",
  "now": "newt",
  "yo": "what",
  "阿姨": "maternal aunt",
  "爱心": "compassion"
}
const speech = new Speech()

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