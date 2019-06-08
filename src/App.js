import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
// import hsk5 from './hsk5.js'
import hsk56 from './hsk5+6.js'
import AWS from 'aws-sdk'

const speech = new Speech()
const polly = new AWS.Polly()
let availableVoices = []

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
      item: null, // object from hsk5+6.js
      play: true,
      progress: 0, // basically whether to say the hanzi, pinyin, or English next
      rows: [], // list of previously said words
      usePolly: true // whether to use Polly for hanzi. Browser TTS will still be used for English.
    }
    if (speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    speech.init().then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing: ", err)
    })

    if (this.state.usePolly) {
      polly.describeVoices({}, (err, data) => {
        if (err)
          console.log(err, err.stack)
        else
          availableVoices = data.Voices
      })
    }
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
   * @param {string} [language] - e.g., 'zh-CN', 'en-US'
   */
  speakBrowser = async (text, rate, language) => {
    if (language)
      await speech.setLanguage(language)
    if (rate)
      await speech.setRate(rate)
    await speech.speak({
      text,
      listeners: { onend: () => {} }
    })
  }

  /**
   * Speaks the given text using Amazon Polly. Assumes that the language is either Chinese (contains 'zh') or otherwise English.
   * 
   * @param {string} text
   * @param {number} [rate] - e.g., 0.5 speaks at 50% the speed.
   * @param {string} [language] - e.g., 'zh-CN', 'en-US'
   */
  speakPolly = async (text, rate, language) => {
    text = rate ?
      `<speak><prosody rate="${rate * 100 << 0}%">${text}</prosody></speak>` :
      `<speak>${text}</speak>`
    await polly.synthesizeSpeech({
      OutputFormat: 'mp3',
      Text: SSML,
      VoiceId: language.includes('zh') ? "Zhiyu" : "Ivy"
    })
  }

  /**
   * Speaks the text with the given rate and language, using Polly if the given language is Chinese, and using the Browser TTS if otherwise. For browser TTS, the rate and language is *set*, so it will be what is used by any subsequent browser TTS calls.
   * 
   * @param {string} text
   * @param {number} [rate] - e.g., 0.5 speaks at 50% the speed.
   * @param {string} [language] - e.g., 'zh-CN', 'en-US'
   */
  speak = async (text, rate, language) => {
    if (language.includes('zh')) {
      await this.speakPolly(text, rate, language)
    } else {
      await this.speakBrowser(text, rate, language)
    }
  }

  /**
   * Speaks the "line" within `item` indicated by `progress`, and then if `this.state.play` is true, calls itself to speak the next line.
   * 
   * @param {number} [progress] - a number within [-1, 4]. By default, -1.
   */
  speakLoop = async (progress = -1) => {
    let item

    if (progress === -1 || !this.state.item) {
      item = await randomItem(hsk56)
      await this.setState({ item })
      let rows = this.state.rows
      rows.unshift(item)
      if (rows.length > 100)
        rows.pop()
      await this.setState({ rows })
    } else {
      item = this.state.item
    }
    
    switch (progress) {
      case 0:
        await this.speak(item.Hanzi, 0.75, 'zh')
        break
      case 1:
        if (navigator.userAgent.includes("Android")) {
          await this.speak(item.Pinyin
            .replace(' ', '. ')
            .replace(/bi\b/g, 'bee')
            .replace(/pi\b/g, 'pee')
            .replace('ca', 'tsa')
            .replace('you', 'yo')
            .replace('rou', 'row')
            .replace('yun', 'yoon')
            .replace('tou', 'tow')
            .replace('zh', 'j')
            .replace(/he\b/g, 'her')
            .replace(/ui/g, 'way')
            .replace(/ei\b/g, 'ay')
            .replace(/([jqx])ao/g, /$1i-ao/)
            .replace(/([jqx])iang/g, /$1i-ang/)
            .replace(/([jqx])iu/g, /$1i-o/)
            .replace(/([jqx])ue/g, /$1u-e/)
            .replace('lie', 'li-eh')
          , 0.75, 'en-UK')
        } else {
          await this.speak(item.Pinyin.replace(' ', '. '), 0.75, 'en-UK')
        }
        break
      case 2:
        await this.speak(item.Hanzi, 0.5, 'zh')
        break
      case 3:
        await this.speak(item.English, 1, 'en-US')
        break
      case 4:
        await this.speak(item.Hanzi, 0.5, 'zh-CN')
        await sleep(500)
    }

    await this.setState({ progress })
    if (this.state.play)
      await this.speakIter(progress === 4 ? -1 : progress + 1)
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
              <p>{this.state.item.Pinyin}</p>
              <p>{this.state.item.English}</p>
            </div>
          }
          <button onClick={this.pause}>Pause</button>
          <button onClick={this.resume}>Resume</button>

          <table>
            {/* <colgroup>
              <col style={{width: "4em"}} />
              <col class={{width: "0em"}} />
              <col class={{width: "50em"}} />
            </colgroup> */}
            <tr key="header">
              <th>Hanzi</th>
              <th>Pinyin</th>
              <th>English</th>
            </tr>
            {this.state.rows.map((obj, i) => (
              <tr key={obj.Hanzi + (this.state.rows.length - i)}>
                {Object.keys(obj).map(key => (
                  <td>{obj[key]}</td>
                ))}
              </tr>
            ))}
          </table>
        </header>
      </div>
    );
  }
}

export default App;