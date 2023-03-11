import React, {useState, useEffect, useRef} from "react";

const useTextInput = () => {

    const [v, vv] = useState('')


    const render = () => {
        return(
            <input type={'text'} value={v} onChange={(e) => vv(e.target.value)}/>
        )
    }

    return({
        v,
        render
    })

}