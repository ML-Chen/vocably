import React, { Component } from 'react'
import './App.css'
import Speech from 'speak-tts'
// import hsk5 from './hsk5.js'
import hsk56 from './hsk5+6.js'

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
      progress: 0, // number representing what line to continue with speaking after paused
      rows: [] // lists previously said words
    }
    if (speech.hasBrowserSupport())
      console.log("Speech synthesis supported by browser")
    speech.init().then(data => {
      console.log("Speech is ready, voices are available", data)
    }).catch(err => {
      console.log("An error occurred while initializing: ", err)
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

    while (true) {
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

      if (progress <= 0) {
        await this.speak(item.Hanzi, 0.75, 'zh')
      }
      if (!this.state.play) {
        this.setState({ progress: 1 })
        break
      }

      if (progress <= 1) {
        if (navigator.userAgent.includes("Android")) {
          await this.speak(item.Pinyin
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
      }
      if (!this.state.play) {
        this.setState({ progress: 2 })
        console.log(this.state.progress)
        break
      }

      if (progress <= 2) {
        await this.speak(item.Hanzi, 0.5, 'zh')
      }
      if (!this.state.play) {
        this.setState({ progress: 3 })
        break
      }

      if (progress <= 3) {
        await this.speak(item.English, 1, 'en-US')
      }
      if (!this.state.play) {
        this.setState({ progress: 4 })
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