import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
import hsk5 from './hsk5.js'

const speech = new Speech()

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const randomItem = list => {
  return new Promise((resolve, reject) => {
    if (list === null || list === [])
      reject(new Error("Keys is null or empty"))
    resolve(list[list.length * Math.random() << 0])
  })
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      item: null,
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

  togglePause = state => {
    console.log(speech.paused())
    if (state.play) {
      speech.pause()
      speech.cancel()
      this.setState({ play: false })
    }
    else {
      speech.resume()
      this.setState({ play: true })
    }
    console.log(speech.paused())
  }

  componentDidMount() {
    const speak = async () => {
      while (true) {
        const item = await randomItem(hsk5)
        await this.setState({ item })
        await speech.setLanguage('zh-CN')
        await speech.setRate(0.75)
        await speech.speak({
          text: item.Hanzi,
          listeners: { onend: () => {} }
        })
        await speech.setRate(0.5)
        await speech.speak({
          text: item.Hanzi,
          listeners: { onend: () => {} }
        })
        await speech.setRate(0.75)
        await speech.setLanguage('en-US')
        await speech.speak({
          text: item.Pinyin,
          listeners: { onend: () => {} }
        })
        await speech.setRate(1)
        await speech.setLanguage('en-US')
        await speech.speak({
          text: item.English,
          listeners: { onend: () => {} }
        })
        await speech.setLanguage('zh-CN')
        await speech.setRate(0.5)
        await speech.speak({
          text: item.Hanzi,
          listeners: { onend: () => {} }
        })
        await sleep(750)
      }
    }
    speak()
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Not Glossika</h1>
          {this.state.item &&
            <div>
              <p className="Hanzi">{this.state.item.Hanzi}</p>
              <p>{this.state.item.Pinyin.replace(/\./g, '')}</p>
              <p>{this.state.item.English}</p>
            </div>
          }
          <button onClick={() => this.togglePause(this.state)}>Play/Pause</button>
        </header>
      </div>
    );
  }
}

export default App;