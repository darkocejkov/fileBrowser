import React, {useState, useEffect, useRef, useCallback, Suspense, useMemo} from 'react';
import './index.css'
import 'plyr/dist/plyr.css'

import axios from "axios";
import {genKey, get, getRandomInt, shuffle, stripString} from "./globalFunctions";
import Plyr from "plyr";
import {DirectoryList} from "./components/directories";
import {Button, Input, Select, Spin, Empty, Tree, notification} from "antd";
import {DownOutlined, FileImageOutlined, FileZipOutlined, FolderOutlined, VideoCameraOutlined, FileUnknownOutlined} from "@ant-design/icons";

const MAX_SIZE_IMAGES = 100
const MAX_SIZE_VIDEOS = 10

export default function App() {

    const [path, setPath] = useState('')

    const [previousDirectories, setPreviousDirectories] = useState([])

    const [loadingManifest, setLoadingManifest] = useState(false)

    const [directory, setDirectory] = useState(null)
    const [inputValue, setInputValue] = useState('')

    const [drives, setDrives] = useState(null)

    const [manifestFiles, setManifestFiles] = useState(null)
    const [manifestDirectories, setManifestDirectories] = useState(null)

    const requestManifest = (dir) => {

        setLoadingManifest(true)

        axios.get(`/manifest/${dir}`)
            .then(data => {
                console.log(`[endpoint] ${dir} DATA`, data)

                let man = data.data

                setManifestFiles(man.files.fileTree)
                setManifestDirectories(man.files.directoryTree)

                setLoadingManifest(false)
            })
            .catch(err => {
                console.log(`[endpoint] ${dir} ERR`, err)

                notification.open({
                    message: err.response.data
                })

                setInputValue('')
                setDirectory(null)

                setLoadingManifest(false)
            })
    }

    const clearDirectory = () => {
        setManifestFiles(null)
        setManifestDirectories(null)

        addDirectory(directory)

        setDirectory(null)
        setInputValue(null)

    }

    const addDirectory = (dir) => {
        if(previousDirectories.includes(dir)) return

        setPreviousDirectories([...previousDirectories, dir])
    }

    const rmDir = (dir) => {
        setPreviousDirectories(previousDirectories.filter(x => {
            if(x === dir){
                return false
            }

            return true
        }))

    }

    const replaceDirectory = (dir) => {
        setInputValue(dir)
        setDirectory(dir)
    }

    useEffect(() => {
        if(directory) {
            requestManifest(directory)
        }
    }, [directory])


    useEffect(() => {
        get('/available', (err, data) => {
            if(err) return null

            let options = []

            data.forEach(x => {
                options.push({
                    value: x,
                    label: x
                })
            })

            console.log('get /available DATA', data)

            setTimeout(() => {
                setDrives(options)

            }, 2000)
        })
    }, [])

    const directoryTree = useMemo(() => {

        if(manifestDirectories){


        }

        return []

    }, [manifestDirectories])



    return(
        <div className={'min-h-screen w-screen overflow-x-clip bg-sky-200 flex flex-col items-center gap-5 p-12'}>

            <div className={'container p-6 shadow-md h-fit'}>


                <div className={'flex flex-col gap-6'}>
                    <div className={'flex gap-2'}>
                        <h1 className={'text-xl whitespace-nowrap'}>Server Directory</h1>
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={directory}/>
                        <Button onClick={() => setDirectory(inputValue)}>
                            Set
                        </Button>
                        <Button type={'primary'} disabled={!directory} danger onClick={() => clearDirectory()}>
                            Clear
                        </Button>
                    </div>

                    <div className={'flex gap-2'}>
                        {previousDirectories.map(x => {
                            return(
                                <div className={'bg-slate-900/10 px-3 py-1 rounded-full overflow-hidden flex gap-2'} key={x} onClick={() => replaceDirectory(x)}>
                                    <code>
                                        {x}
                                    </code>

                                    <button className={'bg-rose-400/40 hover:bg-rose-400 hover:text-white transition-all rounded-xl px-2 '} onClick={() => rmDir(x)}>
                                        &times;
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    <hr />

                    <Spin size={'small'} spinning={!drives} tip={'Loading Drives ...'}>
                        <Select options={drives} className={'w-full'}/>
                    </Spin>
                </div>

            </div>

            <div className={'container p-6 shadow-md full h-fit max-h-[40vh] overflow-y-scroll'}>

                {!manifestFiles &&
                    <Spin spinning={loadingManifest} tip={`Loading manifest for ${inputValue}`}>
                        <Empty description={"No Manifest Loaded"} />
                    </Spin>
                }

                <div className={'flex gap-2'}>

                    <div>
                        {manifestDirectories &&
                            <Tree
                                showLine
                                switcherIcon={<DownOutlined />}
                                className={'bg-transparent w-full'}
                                treeData={manifestDirectories}
                                fieldNames={{
                                    title: 'fileName',
                                    children: 'contents'
                                }}
                            />
                        }
                    </div>

                </div>


            </div>

            <div className={'container p-6 shadow-md full h-fit max-h-[40vh] overflow-y-scroll'}>
                {manifestFiles &&
                    <ListView files={manifestFiles}/>
                }
            </div>

        </div>
    )
}

const Graphs = ({directories, files}) => {


    useEffect(() => {

    }, [directories])


    return null
}

/*

    <ul>
        <li />

        <ul>
            <li />
            <li />
        <ul/>
    </ul>

 */


const ListView = ({files, canCollapse = false, expanded = false}) => {

    const toggle = () => {
        console.log(expanded)
        expanded = !expanded
    }

    // style={{display: (expanded || !canCollapse) ? 'block' : 'none'}}
    return(
        <ul className={'ml-5 p-1'}>
            {files && files.map && files.map(x => {

                if(x.type === 'directory'){

                    if(x.contents.length > 0){
                        return(
                            <>
                                <ListItem fileName={x.fileName} type={'directory'}/>
                                <ListView files={x.contents} canCollapse={true} expanded={expanded}/>
                            </>
                        )
                    }
                }

                return (
                    <ListItem {...x}/>
                )
            })}
        </ul>
    )
}

const ListParent = ({type, fileName}) => {



    return(
        <div>
            <ListItem fileName={fileName} type={'directory'}/>
        </div>
    )
}

const ListLeaf = ({}) => {

}

const ListItem = ({type, fileName, onClick = null}) => {

    const icon = () => {

        if(type === 'directory'){
            return <FolderOutlined className={'self-center'} />
        }else if(type && type.includes('image')){
            return <FileImageOutlined className={'self-center'} />
        }else if(type && type.includes('video')){
            return <VideoCameraOutlined className={'self-center'} />
        }else if(type && type.includes('zip')){
            return <FileZipOutlined className={'self-center'} />
        }else{
            return <FileUnknownOutlined className={'self-center'} />
        }

    }


    return(

        <li className={'px-4 flex gap-2 rounded-xl hover:bg-slate-900/10 w-fit'} onClick={() => onClick && onClick()} key={fileName}>

            {icon()}

            <span >{fileName}</span>

        </li>


    )
}

const ImageVideo = () => {

    const [allImages, setAllImages] = useState(null)
    const [images, setImages] = useState(null)
    const [videos, setVideos] = useState(null)

    const [bg, setBg] = useState(null)
    const [showGrid, setShowGrid] = useState(true)

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
        <>

            <button type={'button'} className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'} onClick={() => requestImages('')}>
                Get Images
            </button>

            <button type={'button'} className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'} onClick={() => requestVideo('')}>
                Get Videos
            </button>


            {bg &&
                <img src={bg} className={'fixed top-0 left-0 object-cover object-center w-screen opacity-50'}/>
            }

            <button onClick={() => setShowGrid(!showGrid)}
                    className={'fixed right-10 bottom-10 bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'}>
                {showGrid ? 'Hide' : 'Show'}
            </button>


            {images &&
                <div className={'flex justify-center gap-5 w-full'}>
                    <button onClick={() => shuffleImages()}
                            className={'bg-orange-400/70 hover:bg-orange-400/100 transition-all p-2 rounded-xl'}>
                        Shuffle Images
                    </button>
                </div>
            }

            <div className={`grid grid-cols-4 gap-4 ${showGrid ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                {images && images.map(x => {
                    return (
                        <Image setBg={setBg} path={''} filename={x} key={x}/>
                    )
                })}
            </div>

            <div className={`grid grid-cols-4 gap-4 ${showGrid ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                {videos && videos.map((x, i) => {
                    return (
                        <Video path={''} i={i} filename={x} key={x}/>
                    )
                })}
            </div>
        </>
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