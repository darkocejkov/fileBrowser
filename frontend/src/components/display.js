import React, {useState, useEffect} from "react";

export const Container = ({children}) => {
    return(
        <div className={'container bg-stone-100 rounded-lg p-6 shadow-md'}>
            {children}
        </div>
    )
}

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