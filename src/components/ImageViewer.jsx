import React, { useState, useEffect, useCallback } from 'react'
import styles from './ImageViewer.module.scss'

const electron = window.require('electron')
const ipcRenderer = electron.ipcRenderer
const dialog = electron.remote.dialog
const remote = electron.remote
const fs = window.require('fs')

export default function ImageViewer() {
    const [image, setImage] = useState(null)
    const [images, setImages] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [currentFileIndex, setCurrentFileIndex] = useState(0)

    useEffect(() => {
        ipcRenderer.on('select-file', (event, image) => {
            setImages([image])
        })

        ipcRenderer.on('select-folder', (event, directory) => {
            setCurrentFileIndex(0)
            localStorage.setItem('folder', directory)

            fs.readdir(directory, (err, files) => {
                if (err) return console.log(err)
                const absolutePathFiles = files.map(file => `${directory}/${file}`)
                setImages(absolutePathFiles)
            })
        })

        const initialFolder = localStorage.getItem('folder')
        if (initialFolder) {
            openFolder(initialFolder)
        }
    }, [])

    useEffect(() => {
        const currentFile = images[currentFileIndex]
        if (!currentFile) return

        setIsLoading(true)
        const selectedFile = fs.readFile(currentFile.toString(), (err, data) => {
            if (err) return console.log(err)
            const image = "data:image/png;base64," + data.toString('base64')
            setImage(image)
            setIsLoading(false)
        })
        setImage(selectedFile)
    }, [currentFileIndex, images])

    const handleImageChange = useCallback((direction) => {
        setCurrentFileIndex(c => ((c + direction) % images.length) > 0 ? (c + direction) % images.length : ((c + direction) % images.length) + images.length)
    }, [images.length])

    const selectRandomImage = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * images.length)
        setCurrentFileIndex(randomIndex)
    }, [images.length])

    const [duration, setDuration] = useState(1)
    const handleDurationChange = e => {
        if (!e.target.value) return setDuration("")
        const updatedValue = parseFloat(e.target.value)
        if (Number.isNaN(updatedValue)) return
        return setDuration(updatedValue)
    }
    const [timer, setTimer] = useState(null)
    const toggleSlideShow = useCallback(() => {
        if (Number.isNaN(parseFloat(duration))) return
        if (!timer) {
            const interval = setInterval(selectRandomImage, duration * 1000)
            return setTimer(interval)
        }

        clearInterval(timer)
        return setTimer(null)
    }, [duration, selectRandomImage, timer])

    useEffect(() => {
        function handleKeyDown(e) {
            switch (e.code) {
                case "Space":
                    selectRandomImage()
                    break
                case "ArrowLeft":
                    handleImageChange(-1)
                    break
                case "ArrowRight":
                    handleImageChange(1)
                    break
                case "Enter":
                    toggleSlideShow()
                    break;
                default:
                    return
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [handleImageChange, selectRandomImage, toggleSlideShow])


    return (
        <div className={styles.root}>
            <div className={styles.gallery}>
                {isLoading ?
                    <p>Loading...</p> :
                    image ?
                        <img src={image} alt="" style={{ maxWidth: '100%', maxHeight: '100%' }} /> :
                        <div>
                            <p><em>No images selected</em></p>
                            <button onClick={openFile}>Open file</button>
                            <button onClick={() => openFolder()}>Open directory</button>
                        </div>
                }
            </div>
            {images.length > 1 && <div className={styles.footer}>
                {!timer && (
                    <>
                        <button onClick={() => handleImageChange(-1)}>Previous</button>
                        <button onClick={() => handleImageChange(1)}>Next</button>
                        <button onClick={selectRandomImage}>Shuffle</button>
                        <button onClick={() => openFolder()}>Open directory</button>
                        <input value={duration} type="number" onChange={handleDurationChange} />
                    </>
                )}
                <button onClick={toggleSlideShow}>{timer ? 'Stop' : 'Start'} Random slideshow</button>
            </div>}
        </div>
    )
}

async function openFolder(initialFolder) {
    if (initialFolder) {
        return remote.getCurrentWebContents().send('select-folder', initialFolder)
    }

    const { filePaths } = await dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openDirectory'],
        filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'jpeg']
        }]
    })

    const folder = filePaths[0]
    if (!folder) return
    remote.getCurrentWebContents().send('select-folder', folder)
}

async function openFile() {
    const { filePaths } = await dialog.showOpenDialog(remote.getCurrentWindow(), {
        properties: ['openFile'],
        filters: [{
            name: 'Images',
            extensions: ['jpg', 'png', 'jpeg']
        }]
    })

    const file = filePaths[0]
    if (!file) return;

    remote.getCurrentWebContents().send('select-file', file)
}