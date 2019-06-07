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
      play: true,
      progress: 0 // number representing what line to continue with speaking after paused
    }
    if (speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    speech.init().then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing: ", err)
    })
  }

  resume = () => {
    if (!this.state.play) {
      this.setState({ play: true })
      speech.resume()
      this.speak(this.state.progress)
    }
  }

  pause = () => {
    if (this.state.play) {
      this.setState({ play: false })
      speech.pause()
    }
  }

  /**
   * Sets the rate and language (if given) and then speaks the text using TTS.
   * 
   * @param {string} text
   * @param {number} [rate]
   * @param {string} [language] - e.g., 'zh-CN', 'en-US'
   */
  speak = async (text, rate, language) => {
    if (language)
      await speech.setLanguage(language)
    if (rate)
      await speech.setRate(rate)
    await speech.speak({
      text,
      listeners: { onend: () => {} }
    })
  }

  speakLoop = async (progress = -1) => {
    let item

    while (this.state.play) {
      if (progress === -1 || !this.state.item) {
        item = await randomItem(hsk5)
        await this.setState({ item })
      } else {
        item = this.state.item
      }

      if (progress <= 0) {
        await this.speak(item.Hanzi, 0.75, 'zh')
      }
      if (!this.state.play) {
        await this.setState({ progress: 0 })
        break
      }

      if (progress <= 1) {
        await this.speak(item.Hanzi, 0.5)
      }
      if (!this.state.play) {
        await this.setState({ progress: 1 })
        break
      }

      if (progress <= 2) {
        await this.speak(item.Pinyin, 0.75, 'en-UK')
        // if (navigator.userAgent.includes("Android"))
        //   await speech.speak({
        //     text: item.Pinyin // replace c with ts
        //   })
      }
      if (!this.state.play) {
        await this.setState({ progress: 2 })
        break
      }

      if (progress <= 3) {
        await this.speak(item.English, 1, 'en-US')
      }
      if (!this.state.play) {
        await this.setState({ progress: 3 })
        break
      }

      if (progress <= 4) {
        await this.speak(item.Hanzi, 0.5, 'zh-CN')
      }
      if (!this.state.play) {
        await this.setState({ progress: -1 })
        break
      }

      progress = -1

      await sleep(750)
    }
  }

  componentDidMount() {
    this.speakLoop()
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.state.item &&
            <div>
              <p lang="zh-han" className="Hanzi">{this.state.item.Hanzi}</p>
              <p>{this.state.item.Pinyin.replace(/\./g, '')}</p>
              <p>{this.state.item.English}</p>
            </div>
          }
          <button onClick={this.pause}>Pause</button>
          <button onClick={this.resume}>Resume</button>
        </header>
      </div>
    );
  }
}

export default App;