import React, {useState, useEffect, useRef, useCallback, Suspense, useMemo} from 'react';
import './index.css'
import 'plyr/dist/plyr.css'
import CodeEditor from '@uiw/react-textarea-code-editor';
import axios from "axios";
import {
    fileTypesOptions,
    genKey,
    get,
    getRandomInt,
    humanFileSize,
    momentFullDateNumeric,
    shuffle,
    stripString
} from "./globalFunctions";
import Plyr from "plyr";
import {DirectoryList} from "./components/directories";
import {Button, Input, Select, Spin, Empty, Tree, notification, Tooltip, InputNumber, Space} from "antd";
import Icon, {
    DownOutlined,
    FileImageOutlined,
    FileZipOutlined,
    FolderOutlined,
    VideoCameraOutlined,
    FileUnknownOutlined,
    AimOutlined, LogoutOutlined, LoadingOutlined, FileTextOutlined, CheckCircleOutlined, PushpinOutlined, PushpinFilled
} from "@ant-design/icons";
import {Container} from "./components/display";
import {json} from "./components/icons";
import {VscJson} from "react-icons/vsc";
import {DiJavascript1} from "react-icons/di";
import {FaMarkdown, FaRegFolder, FaRegFolderOpen} from "react-icons/fa";
import {BsFileImage} from "react-icons/bs";


import moment from "moment";
import {AiOutlineInfoCircle} from "react-icons/ai";
import {Document, Page} from "react-pdf/dist/esm/entry.webpack5";

import { pdfjs } from 'react-pdf';
import {ImFileVideo, ImFileZip} from "react-icons/im";
import {RiEye2Line} from "react-icons/ri";
import {FiExternalLink} from "react-icons/fi";
import {cloneDeep} from "lodash";
import {Pie} from "./components/graphs";
import {ResponsivePie} from "@nivo/pie";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


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
    const [manifestVirtualFiles, setManifestVirtualFiles] = useState(null)

    const extractFiles = (array, done) => {

        let files = []

        for(let file of array){


            if(file.type === 'directory'){
                extractFiles(file.contents, (arr) => {
                   for(let a of arr){
                       files.push(a)
                   }
                });
            }else{
                files.push(file)
            }
        }

        return done(files)
    }

    /*

        dirA
            dirAA
                dirAAA
                    fAAA1
                    fAAA2
                    fAAA3
                f2
        dirB

     */

    useEffect(() => {
        if(!manifestFiles) return

        extractFiles(manifestFiles, (arr) => {
            console.log('extracted: ', arr)

            setManifestVirtualFiles(arr)
        })
    }, [manifestFiles])

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

                setDirectory(null)
                setLoadingManifest(false)
            })
    }

    const clearDirectory = (add = true) => {
        setManifestFiles(null)
        setManifestDirectories(null)

        if(add) addDirectory(directory)

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

    const elementImg = (src) => {
        setPreviewElement(<img className={'max-h-[95vh] w-auto object-cover rounded-lg shadow-md'} src={`http://localhost:3001/serve/path/${src.filePath}`}/>)
    }

    const elementAudio = (src) => {
        setPreviewElement(
            <Audio path={src.filePath} key={src.fileName}/>
        )
    }


    const elementVideo = (src) => {
        setPreviewElement(<Video path={src.filePath} key={src.fileName}/>)
    }

    // https://www.npmjs.com/package/@cyntler/react-doc-viewer
    // https://github.com/plangrid/react-file-viewer

    const [loadingResource, setLoadingResource] = useState(false)

    const [nPage, setNPage] = useState(0)
    const [cPage, setCPage] = useState(1)

    const onLoad = ({numPages}) => {
        setNPage(numPages)
    }

    const elementPdf = (src) => {
        setPreviewElement(
            <div>
                <Document file={`http://localhost:3001/serve/path/${src.filePath}`} onLoadError={(err) => console.log('pdf ERR: ', err)} onLoadSuccess={onLoad}>
                    <Page pageNumber={cPage}/>
                </Document>
                <p>{nPage}</p>
            </div>
        )
    }

    const elementCode = (src, type = '') => {

        // let contents = await axios.get(`http://localhost:3001/serve/path/${src.filePath}`)
        setLoadingResource(true)

        axios.get(`http://localhost:3001/serve/path/${src.filePath}`)
            .then(data => {
                console.log('elementCode DATA: ', data)

                setLoadingResource(false)
                setPreviewElement(<CodeEditor disabled value={data.data} language={type}/>)

            })
            .catch(err => {
                console.log('elementCode ERR: ', err)

            })
    }

    const elementMap = [
        {type: 'image', element: elementImg},
        {type: 'video', element: elementVideo},
        {type: 'audio', element: elementAudio},
        {type: 'text', element: elementCode, prop: 'plaintext'},

        {type: 'javascript', element: elementCode, prop: 'javascript'},
        {type: 'json', element: elementCode, prop: 'json'},
        {type: 'pdf', element: elementPdf},

        {type: 'NO_TYPE', element: elementCode, prop: 'plaintext'}
    ]

    const elementMapper = (preview) => {

        if(!preview.type){
            let m = elementMap.find(x => x.type === 'NO_TYPE')
            return m.element(preview, m.prop)
        }

        for(let element of elementMap){


            if(preview.type.includes(element.type)){

                console.log('elementMapper: ', element)

                if(element.prop){
                    return element.element(preview, element.prop)
                }

                return element.element(preview)
            }

        }
    }

    const [preview, setPreview] = useState(null)

    const [previewElement, setPreviewElement] = useState(null)

    useEffect( () => {

        if(preview){
            return elementMapper(preview)
        }

        return setPreviewElement(null)

    }, [preview])

    const [generating, setGenerating] = useState(false)

    const randomManifest = () => {

        setGenerating(true)

        clearDirectory(false)

        axios.get('/generate/manifest')
            .then(data => {
                console.log('/generate/manifest DATA: ', data)

                setGenerating(false)
                setManifestFiles(data.data)
            })
    }

    const [typeFilter, setTypeFilter] = useState(fileTypesOptions.map(x => x.value))
    const [nOp, setNOp] = useState(1)

    const [chosen, setChosen] = useState(null)
    const [randoming, setRandoming] = useState(false)
    const [randomOrder, setRandomOrder] = useState(false)



    const [counts, setCounts] = useState(null)


    useEffect(() => {

        if(manifestFiles){
            countFiles(manifestFiles, (types) => {
                setCounts(types)
            })
        }


    }, [manifestFiles])

    const virtualTypeFilter = useMemo(() => {


        if(!counts) return fileTypesOptions

        let options = []

        for(let types of fileTypesOptions) {
            let countFind = counts.find(x => x.type === types.label)
            if(countFind){

                options.push(
                    {
                        value: types.value,
                        label: `${types.label} (${countFind.count})`
                    }
                )
            }else{
                options.push(
                    types
                )
            }
        }

        console.log('labelled options: ', options)

        return options
    }, [fileTypesOptions, counts])

    const chooseRandom = (n) => {

        setRandoming(true)

        console.log(typeFilter)

        let files = []

        // clone virtual file list
        let virtuals = cloneDeep(manifestVirtualFiles)
        // filter list for
        virtuals = virtuals.filter(x => !!typeFilter.find(y => y === x.type.split('/')[1]))

        console.log('chosen:', {files, virtuals})


        // if the number of random files to choose is larger than the number of present files, then we don't need to
        //      "randomize"
        if(n > virtuals.length){
            files = virtuals
        }else{

            if(randomPins.length > 0){
                n -= (randomPins.length - 1)
            }

            for(let x = 0; x < n; x++){
                let i = getRandomInt(virtuals.length - 1, 0)
                files.push(virtuals[i])
                virtuals.splice(i, 1)
            }

            randomPins.forEach(x => {
                let virtualFind = virtuals.find(y => y.filePath === x)
                if(virtualFind) files.push(virtualFind)
            })
        }

        if(files.length === 0) files = null

        if(randomOrder){
        //     shuffle contents of array
        }

        setChosen(files)

    }

    useEffect(() => {
        if(randoming && chosen !== null){
            setRandoming(false)
        }

    }, [randoming, chosen])



    useEffect(() => {
        if(directory) localStorage.setItem('lastDirectory', directory)
    }, [directory])


    const [memory, setMemory] = useState(null)

    useEffect(() => {
        let last = localStorage.getItem('lastDirectory')

        if(last) setMemory(last)
    }, [])

    const [randomPins, setRandomPins] = useState([])

    const addPin = (path) => {
        setRandomPins([...randomPins, path])
    }

    const removePin = (path) => {
        setRandomPins(randomPins.filter(x => x !== path))
    }

    useEffect(() => {
        console.log('randomPins: ', randomPins)
    }, [randomPins])

    return(
        // flex flex flex-wrap items-center gap-5
        <div className={'min-h-screen w-screen overflow-x-clip grid grid-cols-1 md:grid-cols-2 gap-2 bg-sky-200  p-12'}>
            <div className={'bg-stone-100 col-span-2 rounded-lg p-6 shadow-md'}>
                <div className={'flex flex-col gap-6'}>
                    <div className={'flex gap-2'}>
                        <h1 className={'text-xl whitespace-nowrap'}>Server Directory</h1>
                        <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={directory}/>
                        <Button type={'text'} disabled={!inputValue} className={'flex items-center gap-1'} onClick={() => setDirectory(inputValue)}>
                            Set

                            {loadingManifest &&
                                <LoadingOutlined spin/>
                            }

                            {!loadingManifest && (manifestFiles || manifestDirectories) &&
                                <CheckCircleOutlined />
                            }

                        </Button>
                        <Button type={'text'} disabled={!directory} className={'bg-red-400'} onClick={() => clearDirectory()}>
                            Clear
                        </Button>
                    </div>

                    <div>

                    </div>

                    <div className={'flex gap-2'}>
                        <Button shape={'round'} className={'bg-orange-400/70 hover:bg-orange-400 flex gap-1 items-center'} onClick={() => randomManifest()}>
                            Generate Random Manifest

                            {generating &&
                                <LoadingOutlined className={'self-center'} spin/>
                            }
                        </Button>

                        {memory &&
                            <Button type={'text'} shape={'round'} className={'flex gap-1  text-slate-900/20'} onClick={() => replaceDirectory(memory)}>Last Used: <code>{memory}</code></Button>
                        }
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

                    <div className={'flex gap-2'}>
                        <h1 className={'whitespace-nowrap'}>Walk Directory</h1>

                        <div className={'w-full'}>

                            <Spin indicator={<LoadingOutlined spin />} size={'small'} spinning={!drives} tip={'Loading Drives ...'}>
                                <Select options={drives} className={'w-full'}/>
                            </Spin>
                        </div>
                    </div>

                </div>

            </div>

            <div className={'container bg-stone-100 rounded-lg p-6 shadow-md'}>
                    <div className={'flex flex-col gap-2 '}>

                        {!manifestDirectories &&
                            <div className={'flex justify-center items-center h-full w-full'}>
                                <Spin indicator={<LoadingOutlined spin />} spinning={loadingManifest} tip={`Loading directory manifest for "${inputValue}"`}>
                                    <Empty  image={Empty.PRESENTED_IMAGE_SIMPLE} description={"No Directory Manifest"} />
                                </Spin>
                            </div>

                        }


                        {manifestDirectories &&
                            <>
                                <div className={'text-center bg-stone-100 w-full h-[2rem]'}>
                                    <h2 className={'text-xl'}>Directory Tree</h2>
                                </div>

                                <div className={'overflow-y-scroll h-fit mt-2 max-h-[80vh]'}>

                                    <ListView files={manifestDirectories} />

                                </div>
                            </>
                        }
                    </div>

            </div>

            <div className={'container bg-stone-100 rounded-lg p-6 shadow-md'}>
                    <div className={'flex flex-col gap-2 '}>

                        {!manifestFiles &&
                            <Spin indicator={<LoadingOutlined spin />} spinning={loadingManifest} tip={`Loading file manifest for "${inputValue}"`}>
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No Files Loaded ...'}/>
                            </Spin>
                        }

                        {manifestFiles &&
                            <>
                                <div className={'text-center bg-stone-100 w-full h-[2rem]'}>
                                    <h2 className={'text-xl'}>File Tree</h2>
                                </div>

                                <div className={'overflow-y-scroll h-fit mt-2 max-h-[80vh]'}>
                                        <ListView files={manifestFiles} setPreview={setPreview}/>
                                </div>
                            </>
                        }

                    </div>

            </div>

            <div className={'container bg-stone-100 rounded-lg p-6 shadow-md'}>
                <div className={'flex flex-col gap-2 h-full w-full'}>

                    {!previewElement &&
                        <div className={'h-full w-full flex justify-center items-center'}>
                            <Spin indicator={<LoadingOutlined spin />} spinning={loadingResource} tip={'Loading Resource'}>

                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'Preview Unavailable ...'}/>
                            </Spin>
                        </div>
                    }

                    {previewElement &&
                        <div>
                            <div className={'text-center bg-stone-100 w-full h-[2rem]'}>
                                <h2 className={'text-xl'}>File Preview</h2>
                            </div>

                            {previewElement}
                        </div>
                    }
                </div>
            </div>

            <Container>
                <div className={'flex flex-col gap-2'}>

                    {!manifestFiles &&

                        <div className={'h-full w-full flex justify-center items-center'}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No Files to Stat ...'}/>
                        </div>
                    }

                    {manifestFiles &&
                        <>
                            <div className={'text-center bg-stone-100 w-full h-[2rem]'}>
                                <h2 className={'text-xl'}>
                                    Directory Statistics
                                </h2>
                            </div>

                            <div className={'w-full overflow-x-auto'}>

                                <Graphs files={manifestFiles} typeCounts={counts} />


                            </div>

                        </>
                    }
                </div>
            </Container>

            <Container>
                <div className={'flex flex-col gap-2'}>

                    {!manifestFiles &&
                        <div className={'h-full w-full flex justify-center items-center'}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'No Files to Action...'}/>
                        </div>
                    }

                    {manifestFiles &&
                        <>
                            <div className={'text-center bg-stone-100 w-full h-[2rem]'}>
                                <h2 className={'text-xl'}>
                                    Actions
                                </h2>
                            </div>

                            <Select options={virtualTypeFilter || fileTypesOptions} mode={'multiple'} value={typeFilter} onChange={(e) => setTypeFilter(e)}/>

                            <div className={'w-full flex flex-col gap-2'}>

                                <div className={'flex gap-2'}>
                                    <Space.Compact>
                                        <InputNumber min={1} max={10} value={nOp} onChange={(n) => setNOp(n)}/>

                                        <Button className={'flex gap-1'} onClick={() => chooseRandom(nOp)}>
                                            Random

                                            {randoming &&
                                                <LoadingOutlined className={'self-center'} spin/>
                                            }

                                        </Button>
                                    </Space.Compact>


                                    {chosen &&
                                        <Button type={'text'} className={'bg-rose-400'}>
                                            Execute All
                                        </Button>
                                    }



                                </div>

                                <div className={'flex flex-wrap gap-2 p-4 bg-slate-900/10 rounded-lg'}>
                                    {chosen &&
                                        chosen.map(x => {
                                            return (
                                                <div key={x.filePath} className={'flex-1 p-2 relative flex flex-col justify-center gap-2 items-center text-center rounded-lg text-center bg-slate-900/40 overflow-clip'}>

                                                    {x.type.includes('image') &&
                                                            <img className={'z-0 w-full blur-xs h-full absolute top-0 left-0 object-cover opacity-20'} src={`http://localhost:3001/serve/path/${x.filePath}`}/>
                                                    }

                                                    <span className={'z-10 text-xs'}>
                                                        {x.fileName.split('.')[0]}
                                                    </span>

                                                    {randomPins.includes(x.filePath)
                                                        ? (
                                                            <Tooltip title={'Unpin'}>
                                                                <Button className={'flex items-center justify-center'} type={'text'} onClick={() => removePin(x.filePath)}>
                                                                    <PushpinFilled className={'self-center'}/>
                                                                </Button>
                                                            </Tooltip>
                                                        )
                                                        : (
                                                            <Tooltip title={'Pin'}>
                                                                <Button className={'flex items-center justify-center'} type={'text'} onClick={() => addPin(x.filePath)}>
                                                                    <PushpinOutlined className={'self-center'}/>
                                                                </Button>
                                                            </Tooltip>


                                                        )}

                                                </div>
                                            )
                                        })
                                    }

                                    {!chosen &&
                                        <span className={'opacity-50 text-center w-full'}>No Files Chosen</span>
                                    }
                                </div>

                            </div>

                        </>
                    }
                </div>
            </Container>

        </div>
    )
}


const filesPerFolder = (folder, done = () => null) => {
    let details = {
        dir: '/',
        types: [],
        subDir: []
    }

    if(Array.isArray(folder)){

        folder.forEach(x => {

            if(x.type !== 'directory'){
                let f = details.types.find(y => y.type === x.type)

                if(f){
                    f.count += 1
                }else{
                    details.types.push({
                        type: x.type,
                        count: 1,
                    })
                }
            }else{

                filesPerFolder(x.contents, (deets) => {
                    deets.dir = x.fileName
                    details.subDir.push(
                        deets
                    )
                })


            }


        })
    }

    return done(details)
}

const countFiles = (folder, done = () => null) => {

    let types = []

    const add = (obj, count) => {
        let f = types.find(y => y.type === obj.type)

        if(f){
            f.count += count
        }else{
            types.push({
                type: obj.type,
                count: count,
            })
        }
    }

    if(Array.isArray(folder)){
        folder.forEach(x => {

            if(x.type === 'directory'){
                countFiles(x.contents, (arr) => {
                    // console.log('[dir]: ', {dir: x.fileName, arr})

                    arr.forEach(x => {
                        add(x, x.count)
                    })

                })
            }else{
                add(x, 1)
            }

        })
    }

    return done(types)

}


const Graphs = ({directories, typeCounts = [], files = []}) => {

    const [typesTotal, setTypesTotal] = useState(null)
    const [typesByFolder, setTypesByFolder] = useState(null)

    useEffect(() => {

        if(!typeCounts){
            countFiles(files, (data) => {
                console.log('[countFiles] DATA: ', data)
                setTypesTotal(data)
            })
        }else{
            setTypesTotal(typeCounts)
        }

        let countsPerFolder = filesPerFolder(files, (data) => {
            console.log('[filesPerFolder] DATA: ', data)
            setTypesByFolder(data)

        })
    }, [files, typeCounts])

    // general type = IMAGE / VIDEO / TEXT
    // sub type = MP3 / JPG / PNG / MP4

    const typesGeneralTotal = useMemo(() => {

        if(!typesTotal) return []

        let generals = []

        typesTotal.forEach(x => {

            let split = x.type.split('/')
            let gen = split[0]
            let sub = split[1]

            let genFind = generals.find(y => y.type === gen)

            if(genFind){
                genFind.count += x.count
            }else{
                generals.push({
                    type: gen,
                    count: x.count
                })
            }
        })

        console.log('generals: ', generals)

        return generals


    }, [typesTotal])

    const generalTypeTotalPie = useMemo(() => {

        if(!typesGeneralTotal) return []

        let data = []

        for(let type of typesGeneralTotal){
            data.push({
                id: type.type,
                label: type.type,
                value: type.count,
            })
        }

        console.log('generalTypeTotalPie', data)

        return data

    }, [typesGeneralTotal])


    return(
        <div className={'h-[300px] w-[300px]'}>

            {generalTypeTotalPie &&
                <Pie data={generalTypeTotalPie} />

            }

        </div>
    )
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


const ListView = ({files, canCollapse = false, expanded = false, setPreview}) => {

    const toggle = () => {
        console.log(expanded)
        expanded = !expanded
    }

    const [selected, setSelected] = useState([])

    const addSelect = () => {

    }

    const removeSelect = () => {

    }

    // style={{display: (expanded || !canCollapse) ? 'block' : 'none'}}
    return(
        <ul className={'ml-5 p-1'}>
            {files && files.map && files.map(x => {

                if(x.type === 'directory'){

                    if(x.contents.length > 0){
                        return(
                            <>
                                <ListItem stats={x.stats} fileName={x.fileName} type={'directory'}/>
                                <ListView files={x.contents} canCollapse={true} expanded={expanded} setPreview={setPreview}/>
                            </>
                        )
                    }
                }

                return (
                    <ListItem {...x} setPreview={setPreview} self={x} className={''}/>
                )
            })}
        </ul>
    )
}

const iconMap = [

    // high specificify/priority on top
    {type: 'javascript', icon: <DiJavascript1 className={'self-center'}/>},
    {type: 'json', icon: <VscJson className={'self-center'}/>},
    {type: 'markdown', icon: <FaMarkdown className={'self-center'}/>},

    // generic types
    {type: 'text', icon: <FileTextOutlined className={'self-center'}/>},
    {type: 'directory', icon: <FaRegFolder className={'self-center'} />},
    {type: 'video', icon: <ImFileVideo className={'self-center'} />},
    {type: 'image', icon: <BsFileImage className={'self-center'} />},
    {type: 'zip', icon: <ImFileZip className={'self-center'}/>},
]

const iconFind = (type) => {

    for(let icon of iconMap){
        if(type.includes(icon.type)){
            return icon.icon
        }
    }

    return <FileUnknownOutlined className={'self-center'} />
}

const ListItem = ({type, fileName, filePath, onClick = null, stats, setPreview, self, className = ''}) => {

    const execute = (path) => {
        get(`/video/exec/${path}`, (err, data) => {
            return
        })
    }


    const actions = (type) => {
        if(type === 'directory'){
            return null
        }

        return(
            <>

                <Tooltip title={'Preview'}>
                    <span className={'self-center'}>
                        <RiEye2Line tabIndex={1} onClick={() => setPreview(self)} className={'self-center'} />
                    </span>
                </Tooltip>


                {type && type.includes('video') &&
                    <Tooltip title={'Open Externally'}>
                        <span className={'self-center'}>
                            <FiExternalLink tabIndex={1} onClick={() => execute(filePath)} className={'self-center'} />
                        </span>
                    </Tooltip>


                }

            </>

        )
    }

    const statInfo = (stats, type, title) => {

        return(
            <table>
                <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Created</td>
                    <td>{stats && moment(stats.birthtime).format(momentFullDateNumeric) || "?"}</td>
                </tr>
                <tr>
                    <td>Accessed</td>
                    <td>{stats && moment(stats.atime).format(momentFullDateNumeric) || "?"}</td>
                </tr>
                <tr>
                    <td>Modified</td>
                    <td>{stats && moment(stats.mtime).format(momentFullDateNumeric) || "?"}</td>
                </tr>
                <tr>
                    <td>Size</td>
                    <td>{stats && humanFileSize(stats.size) || "?"}</td>
                </tr>
                <tr>
                    <td>MIME</td>
                    <td>{type || `?`}</td>
                </tr>
            </table>
        )

        return(
            <>
                <p>Created: {stats?.birthtime}</p>
                <p>Accessed: {stats?.atime}</p>
                <p>Modified: {stats?.mtime}</p>
                <p>Bytes: {stats?.size}</p>
                <p>MIME: {type}</p>
            </>
        )

    }

    return(
        <li className={`px-4 flex gap-2 rounded-xl hover:bg-slate-900/10 w-fit ${className}`} onClick={() => onClick && onClick()} key={fileName}>

            <Tooltip title={statInfo(stats, type, fileName)}>
                <span className={'self-center'}>
                    {type && iconFind(type)}
                </span>
            </Tooltip>

            <Tooltip title={fileName}>
                <span className={'truncate'} onClick={() => console.log(stats)}>{fileName}</span>
            </Tooltip>

            {actions(type)}

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

const Audio = ({path, type}) => {

    return(
        <audio>
            <source src={`http://localhost:3001/serve/path/${path}`} type={type}/>
        </audio>
    )

}

const Video = ({path, type}) => {

    const plyrRef = useRef()

    // useEffect(() => {
    //
    //     if(plyrRef.current){
    //         plyrRef.current.destroy()
    //     }
    //
    //     const player = new Plyr(`#previewPlyr`);
    //     plyrRef.current = player
    // }, [path, type])

    const frame = useMemo(() => {

        return(
            <source src={`http://localhost:3001/serve/path/${path}`} type={type}/>
        )

    }, [path, type])



    return(
        <video id={'previewPlyr'} className={'rounded-md'} playsInline controls >
            {frame}
        </video>

    )
}

const Image = ({filename, path}) => {
    return(
        <div className={'relative group'}>
            <img className={'w-full object-cover min-h-[30vh] max-h-[30vh] rounded-lg shadow-md'} src={`http://localhost:3001/serve/path/${path}`}/>

            <img className={'absolute top-0 left-0 opacity-0 group-hover:opacity-100 z-10 transition-all group-hover:scale-[1.2] rounded-xl shadow-2xl'} src={`http://localhost:3001/serve/path/${path}`}/>


            {/*<div className={'h-full w-full absolute top-0 left-0 bg-slate-900/10 opacity-0 hover:opacity-100 transition-all flex flex-col gap-2 justify-center items-center'}>*/}
            {/*    {filename}*/}

            {/*    <button onClick={() => setBg(`http://localhost:3001/${path}/${filename}`)}>*/}
            {/*        BG*/}
            {/*    </button>*/}
            {/*</div>*/}
        </div>
    )
}