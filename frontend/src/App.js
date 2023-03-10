import React, {useState, useEffect, useRef, useCallback} from 'react';
import './index.css'
import 'plyr/dist/plyr.css'

import axios from "axios";
import {genKey, getRandomInt, shuffle, stripString} from "./globalFunctions";
import Plyr from "plyr";

const uuid = require("uuid")

const MAX_SIZE_IMAGES = 100
const MAX_SIZE_VIDEOS = 10

export default function App() {

    const [path, setPath] = useState('')

    const [bg, setBg] = useState(null)
    const [showGrid, setShowGrid] = useState(true)

    const [retData, setRetData] = useState(null)


    const requestFiles = (path) => {
        axios.post(`/files`, {
            absolutePath: path
        })
            .then(data => {
                console.log(data)
                setRetData(data.data)
            })
    }

    const [allImages, setAllImages] = useState(null)
    const [images, setImages] = useState(null)
    const [videos, setVideos] = useState(null)

    const requestImages = (path) => {
        setVideos(null)

        axios.post(`/images`, {
            absolutePath: path,
        })
            .then(data => {
                console.log(data)



                let imgs = data.data.images

                setAllImages(imgs)

                let l = getRandomInt(imgs.length - MAX_SIZE_IMAGES, 0)
                let truncated = imgs.slice(l, l + MAX_SIZE_IMAGES)

                let totalRandom = []
                let randoms = []
                for(let x = 0; x < MAX_SIZE_IMAGES; x++){

                    let r = getRandomInt(imgs.length - 1, 0)

                    while(randoms.includes(r)){
                        r = getRandomInt(imgs.length - 1, 0)
                    }

                    randoms.push(r)

                    totalRandom.push(
                        imgs[r]
                    )
                }

                setImages(totalRandom)
                // setImages(truncated)
            })
    }

    const requestVideo = (path) => {
        setImages(null)

        axios.post(`/videos`, {
            absolutePath: path,
        })
            .then(data => {
                console.log(data)

                let vids = data.data.videos

                let l = getRandomInt(vids.length - MAX_SIZE_VIDEOS, 0)

                let truncated = vids.slice(l, l + MAX_SIZE_VIDEOS)

                setVideos(truncated)
            })
    }

    const shuffleImages = () => {
        let totalRandom = []
        let randoms = []
        for(let x = 0; x < MAX_SIZE_IMAGES; x++){

            let r = getRandomInt(allImages.length - 1, 0)

            while(randoms.includes(r)){
                r = getRandomInt(allImages.length - 1, 0)
            }

            randoms.push(r)

            totalRandom.push(
                allImages[r]
            )
        }

        setImages(totalRandom)
    }

      return(
          <div className={'min-h-screen w-screen overflow-x-clip bg-sky-200 flex justify-center items-center'}>
              <div className={'container flex flex-col gap-5 '}>
                  <input type={'text'} value={path} onChange={(e) => setPath(e.target.value)}/>
                  <div className={'flex gap-2 justify-evenly'}>
                      <button type={'button'} className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'} onClick={() => requestImages('')}>
                          Get Images
                      </button>

                      <button type={'button'} className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'} onClick={() => requestVideo('')}>
                          Get Videos
                      </button>
                  </div>


                  {bg &&
                    <img src={bg} className={'fixed top-0 left-0 object-cover object-center w-screen opacity-50'}/>
                  }

                  <button onClick={() => setShowGrid(!showGrid)} className={'fixed right-10 bottom-10 bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'}>
                      {showGrid ? 'Hide' : 'Show'}
                  </button>


                  {images &&
                      <div className={'flex justify-center gap-5 w-full'}>
                          <button onClick={() => shuffleImages()} className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'}>
                              Shuffle Images
                          </button>
                      </div>
                  }

                  <div className={`grid grid-cols-4 gap-4 ${showGrid ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                      {images && images.map(x => {
                          return(
                              <Image setBg={setBg} path={''} filename={x} key={x}/>
                          )
                      })}
                  </div>

                  <div className={`grid grid-cols-4 gap-4 ${showGrid ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                      {videos && videos.map((x, i) => {
                          return(
                              <Video path={''} i={i} filename={x} key={x}/>
                          )
                      })}
                  </div>



              </div>

          </div>
      )
}

const Video = ({filename, path, i}) => {

    const videoRef = useCallback((node) => {
        console.log(node)

        const player = new Plyr(node)

    }, [])

    return(
        <video ref={videoRef} playsInline controls >
            <source src={`http://localhost:3001/${path}/${filename}`} type="video/mp4"/>
        </video>

    )
}

const Image = ({filename, path, setBg}) => {
    return(
        <div className={'relative group'}>
            <img className={'w-full object-cover min-h-[30vh] max-h-[30vh] rounded-lg shadow-md'} src={`http://localhost:3001/${path}/${filename}`}/>

            <img className={'absolute top-0 left-0 opacity-0 group-hover:opacity-100 z-10 transition-all group-hover:scale-[1.5] rounded-xl shadow-2xl'} src={`http://localhost:3001/${path}/${filename}`}/>


            {/*<div className={'h-full w-full absolute top-0 left-0 bg-slate-900/10 opacity-0 hover:opacity-100 transition-all flex flex-col gap-2 justify-center items-center'}>*/}
            {/*    {filename}*/}

            {/*    <button onClick={() => setBg(`http://localhost:3001/${path}/${filename}`)}>*/}
            {/*        BG*/}
            {/*    </button>*/}
            {/*</div>*/}
        </div>
    )
}