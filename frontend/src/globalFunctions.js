import axios from 'axios'

export const momentFullDateNumeric = 'YYYY/MM/DD, HH:mm:ss'

export const fileTypesOptions = [
    {value: 'mp4', label: 'video/mp4'},
    {value: 'png', label: 'image/png'},
    {value: 'jpeg', label: 'image/jpeg'},
    {value: 'mpeg', label: 'audio/mpeg'},
    {value: 'pdf', label: 'application/pdf'},
]


export const get = (endpoint, callback) => {
    axios.get(endpoint)
        .then(data => {

            return callback(null, data.data)
        })
        .catch(err => {
            return callback(err)
        })
}

export function getRandomInt(max, min = 1) {
    return Math.floor(Math.random() * max) + min;
}

export const getRandomMember = (array) => {
    return array[Math.floor(Math.random() * array.length - 1)]
}

export function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

export function genKey(n = 8){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function stripString(str){
    return str.replace(/[`~!@#$%^&*()|+-=?;:'",.<>{}[]\/\s]/gi,'');
}

export function humanFileSize(bytes, si=false, dp=1) {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10**dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return bytes.toFixed(dp) + ' ' + units[u];
}