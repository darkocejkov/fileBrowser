import React, {useState, useEffect, useRef} from "react";

export const Button = ({children, onClick, className = ''}) => {
    return(
        <button type={'button'} className={`btn-orange ${className}`} onClick={() => onClick()}>
            {children}
        </button>
    )
}