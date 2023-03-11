import React, {useState, useEffect} from "react";

export const Drawer = () => {

    const [open, setOpen] = useState(false)

    return(
        <div className={'fixed top-0'}>

        </div>
    )

}

export const LoadingFallback = ({children}) => {
    return(
        <div className={'h-[2rem] w-full'}>

        </div>
    )
}