import React, {useState, useEffect} from 'react';
import './index.css'
import axios from "axios";

export default function App() {


    useEffect( () => {
        axios.get(`/api/test/${4}`)
            .then(data => {
                console.log(data)
            })
    }, [])

      return(
          <div className={'h-screen w-screen bg-sky-200'}>
            hi !
          </div>
      )
}
