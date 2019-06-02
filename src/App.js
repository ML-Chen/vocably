import React, { Component } from 'react';
import './App.css';
import Speech from 'speak-tts'

class App extends React.Component {
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
    }).catch(e => {
      console.log("An error occurred while initializing: ", e)
    })
  }

  randomKey = dict => {
    const keys = Object.keys(dict) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    return keys[keys.length * Math.random() << 0]
  }
  
  render() {
    while (this.state.play) {
      (async () => {
        const randomKey = randomKey(this.vocabDict)
        await this.speech.speak({
          text: randomKey
        })
        await this.speech.speak({
          text: this.vocabDict[randomKey]
        })
      })();
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