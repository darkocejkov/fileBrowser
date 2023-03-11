import React, {useState, useEffect, useRef} from "react";
// import {Button} from "./basics";

import {Input, Button} from 'antd'

export const DirectoryList = () => {

    const [directories, setDirectories] = useState([])

    const addDir = () => {
        setDirectories([...directories, {
            path: ''
        }])
    }

    const removeDir = (i) => {
        setDirectories(directories.filter((_, j) => {
            if(i !== j){
                return _
            }

            return null
        }))
    }


    return(
        <div className={'container shadow-lg'}>

            <div className={' flex flex-col gap-5'}>
                {directories.map(x => {
                    return(
                        <DirectoryInput />
                    )
                })}
            </div>


            <Button className={'w-1/2 bg-amber-400'} onClick={() => addDir()}>
                +
            </Button>

        </div>
    )
}

const DirectoryInput = ({onRemove, onChange, value}) => {
    return(
        <div className={'flex gap-2'}>

            <Input className={'shadow-md'} value={value} onChange={onChange}/>
            <Button className={'text-black bg-rose-400 shadow-md'}>
                -
            </Button>

        </div>
    )
}