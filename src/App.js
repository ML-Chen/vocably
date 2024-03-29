import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
import hsk56 from './hsk5+6.js'
import AWS from 'aws-sdk'
import awsconfig from './awsconfig.js'
import ChattyKathy from './ChattyKathy.js'

const speech = new Speech()
AWS.config.update(awsconfig)
const kathy = ChattyKathy({
  awsCredentials: new AWS.Credentials(awsconfig.accessKeyId, awsconfig.secretAccessKey),
  awsRegion: awsconfig.region,
  pollyVoiceId: "Zhiyu",
  cacheSpeech: true
})

const sleep = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gets a random item from a list
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
      item: null, // object (Hanzi, Pinyin, and English) from hsk5+6.js
      play: false,
      progress: 0, // what "line" within the object to say next
      rows: [], // list of previously said words
      usePolly: true // whether to use Polly or browser TTS for hanzi
    }
    if (speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    speech.init({
      'lang': 'en-US',
      'volume': 0.75
    }).then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing native speech synthesis: ", err)
    })
  }

  resume = async () => {
    await this.setState({ play: true })
    speech.resume()
    await this.speakLoop(this.state.progress)
  }

  pause = () => {
    this.setState({ play: false })
    // speech.pause()
    speech.cancel()
  }

  /**
   * Sets the rate and language (if given) and then speaks the text using the browser TTS.
   * 
   * @param {string} text
   * @param {number} [rate] - e.g., 0.5 speaks at 50% the speed.
   * @param {number} [volume] - e.g., 0.5 speaks at 50% the normal speed.
   */
  speakBrowser = async (text, rate, volume) => {
    if (rate)
      await speech.setRate(rate)
    if (volume)
      await speech.setVolume(volume)
    await speech.speak({
      text,
      listeners: { onend: () => {} }
    })
  }

  // /**
  //  * Speaks the given text using Amazon Polly. Assumes that the language is either Chinese (contains 'zh') or otherwise English.
  //  * 
  //  * @param {string} text
  //  * @param {number} [rate] - e.g., 0.5 speaks at 50% the speed.
  //  * @param {string} [language] - e.g., 'zh-CN', 'en-US'
  //  */
  // speakPolly = async (text, rate, language) => {
  //   text = rate ?
  //     `<speak><prosody rate="${rate * 100 << 0}%">${text}</prosody></speak>` :
  //     `<speak>${text}</speak>`
  //   await polly.synthesizeSpeech({
  //     OutputFormat: 'mp3',
  //     Text: "SSML",
  //     VoiceId: language.includes('zh') ? "Zhiyu" : "Ivy"
  //   })
  // }

  speakPolly = async (text) => {
    await kathy.SpeakWithPromise(text)
  }

  /**
   * Speaks the "line" within `item` indicated by `progress`, and then if `this.state.play` is true, calls itself to speak the next line.
   * 
   * @param {number} [progress] - a number within [-1, 3]. By default, -1.
   */
  speakLoop = async (progress = -1) => {
    let item

    if (progress === -1 || !this.state.item) {
      item = await randomItem(hsk56)
      await this.setState({ item })
    } else {
      item = this.state.item
    }
    
    if (this.state.play) {
      switch (progress) {
        case -1:
          break
        case 0:
          await this.speakPolly(item.Hanzi)
          await sleep(500)
          break
        case 1:
          await this.speakPolly(item.Hanzi)
          break
        case 2:
          await this.speakBrowser(item.English)
          break
        case 3:
          await this.speakPolly(item.Hanzi)
          await sleep(500)
          let rows = this.state.rows
          rows.unshift(item)
          if (rows.length > 100)
            rows.pop()
          await this.setState({ rows })
          break
        default:
          console.log("speakLoop called with invalid number (not in [-1, 3]")
      }
    }

    await this.setState({ progress })
    if (this.state.play)
      await this.speakLoop(progress === 3 ? -1 : progress + 1)
  }

  componentDidMount() {
    this.speakLoop(0)
  }
  
  render() {
    return (
      <div className="App">
        <header className="App-header">
          {this.state.item &&
            <div>
              <p lang="zh-han" className="Hanzi">{this.state.item.Hanzi}</p>
              <p>{this.state.item.Pinyin}</p>
              <p>{this.state.item.English}</p>
            </div>
          }
          <button onClick={this.resume}>Play</button><button onClick={this.pause}>Pause</button>

          <table>
            <tbody>
              <tr key="header">
                <th>Hanzi</th>
                <th>Pinyin</th>
                <th>English</th>
              </tr>
              {this.state.rows.map((obj, i) => (
                <tr key={obj.Hanzi + (this.state.rows.length - i)}>
                  {Object.keys(obj).map(key => (
                    <td key={key}>{obj[key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </header>
      </div>
    );
  }
}

export default App;