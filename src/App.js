import React, { Component } from 'react';
import './App.css';
import Speech from 'speak-tts'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      play: true
    }
    this.vocabDict = {
      "hi": "hello",
      "now": "newt",
      "yo": "what"
    }
    this.speech = new Speech()
    if (this.speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    this.speech.init().then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing: ", err)
    })
  }

  randomKey = dict => {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(dict)
      if (keys === null || keys === [])
        reject(new Error("Keys is null or empty"))
      resolve(keys[keys.length * Math.random() << 0])
    })
  }
  
  render() {
    for (let i = 0; i < 100; i++) {
      (async () => {
        const key = await this.randomKey(this.vocabDict)
        await this.speech.speak({ text: key })
        await console.log(i**2)
        await sleep(500)
        await this.speech.speak({ text: this.vocabDict[key] })
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