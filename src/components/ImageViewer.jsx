import React, { useState, useEffect, useCallback } from 'react'
import styles from './ImageViewer.module.scss'
import DisplayLocalImage from './DisplayLocalImage'
import DisplayMasonry from './DisplayMasonry'

const electron = window.require('electron')
const ipcRenderer = electron.ipcRenderer
const dialog = electron.remote.dialog
const remote = electron.remote
const fs = window.require('fs')

export default function ImageViewer() {
    const [images, setImages] = useState([])
    const [currentFileIndex, setCurrentFileIndex] = useState(0)

    useEffect(() => {
        ipcRenderer.on('select-file', (event, image) => {
            setImages([image])
        })

        ipcRenderer.on('select-folder', (event, directory) => {
            console.log('folder selected')
            setCurrentFileIndex(0)
            // localStorage.setItem('folder', directory)

            fs.readdir(directory, (err, files) => {
                if (err) return console.log(err)
                const absolutePathFiles = files.map(file => `${directory}/${file}`)
                setImages(absolutePathFiles)
            })
        })
    }, [])

    const handleImageChange = useCallback((direction) => {
        setCurrentFileIndex(c => ((c + direction) % images.length) > 0 ? (c + direction) % images.length : ((c + direction) % images.length) + images.length)
    }, [images.length])

    const [duration, setDuration] = useState(1)
    const handleDurationChange = e => {
        if (!e.target.value) return setDuration("")
        const updatedValue = parseFloat(e.target.value)
        if (Number.isNaN(updatedValue)) return
        return setDuration(updatedValue)
    }

    const [timer, setTimer] = useState(null)
    const selectRandomImage = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * images.length)
        setCurrentFileIndex(randomIndex)
    }, [images.length])
    const toggleSlideShow = useCallback(() => {
        if (Number.isNaN(parseFloat(duration))) return
        if (!timer) {
            const interval = setInterval(selectRandomImage, duration * 1000)
            return setTimer(interval)
        }

        clearInterval(timer)
        return setTimer(null)
    }, [duration, selectRandomImage, timer])

    const shuffle = () => {
        setImages(prevImages => {
            const result = [...prevImages]
            let currentIndex = result.length
            let temporaryValue, randomIndex;

            // While there remain elements to shuffle...
            while (0 !== currentIndex) {

                // Pick a remaining element...
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex -= 1;

                // And swap it with the current element.
                temporaryValue = result[currentIndex];
                result[currentIndex] = result[randomIndex];
                result[randomIndex] = temporaryValue;
            }
            return result
        })
    }

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

    const [fullScreen, setFullScreen] = useState(false)
    const toggleFullScreen = () => setFullScreen(s => !s)

    const [isGalleryView, setIsGalleryView] = useState(false)
    const toggleGalleryView = () => setIsGalleryView(c => !c)
    const [numberOfColumns, setNumberOfColumns] = useState(2)
    const handleColumnsChange = e => {
        if (!e.target.value) return setNumberOfColumns("")
        const updatedValue = parseFloat(e.target.value)
        if (Number.isNaN(updatedValue)) return
        return setNumberOfColumns(updatedValue)
    }

    return (
        <div className={`${styles.root} ${fullScreen ? styles.isFullScreen : ''}`}>
            <div className={styles.gallery}>
                {!images[currentFileIndex] ?
                    <div className={styles.chooseFileOrFolder}>
                        <p><em>No images selected</em></p>
                        <button onClick={openFile} className="button">Open file</button>
                        <button onClick={() => openFolder()} className="button">Open directory</button>
                    </div> :
                    isGalleryView ? (
                        <div style={{ position: 'relative' }}>
                            <DisplayMasonry images={images} cols={numberOfColumns} />
                        </div>
                    ) : <div className={styles.singleImage}>
                            <DisplayLocalImage src={images[currentFileIndex]} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        </div>
                }
            </div>
            {!fullScreen ?
                <div className={styles.footer}>
                    {!timer && (
                        <div className="buttons has-addons is-centered is-marginless">
                            <button onClick={toggleGalleryView} className="button is-marginless">Toggle View</button>
                            <button onClick={() => openFolder()} className="button is-marginless">Open directory</button>
                        </div>
                    )}
                    {isGalleryView ? (
                        <div className={styles.controlSlideShow}>
                            <label htmlFor="#numberOfCols" style={{ margin: '0.5rem' }}>Columns</label>
                            <input id="numberOfCols" value={numberOfColumns} className="input" type="number" onChange={handleColumnsChange} />
                        </div>
                    ) : (
                            <div className={styles.controlSlideShow}>
                                <button onClick={() => handleImageChange(-1)} className="button is-marginless">Previous</button>
                                <button onClick={() => handleImageChange(1)} className="button is-marginless">Next</button>
                                <button onClick={selectRandomImage} className="button is-marginless">Random Image</button>
                                <input value={duration} className="input" type="number" onChange={handleDurationChange} />
                                <button onClick={toggleSlideShow} className="button">{timer ? 'Stop' : 'Start'} Random slideshow</button>
                            </div>
                        )}
                    <div className="buttons has-addons is-centered is-marginless">
                        <button onClick={toggleFullScreen} className="button is-marginless">Full Screen</button>
                        <button onClick={shuffle} className="button is-marginless">Shuffle</button>
                    </div>
                </div> : <button onClick={() => {
                    toggleFullScreen()
                    if (timer) toggleSlideShow()
                }} className={`delete ${styles.closeFullScreenButton}`}></button>}
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
            extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mkv']
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
            extensions: ['jpg', 'png', 'jpeg', 'mp4', 'mkv']
        }]
    })

    const file = filePaths[0]
    if (!file) return;

    remote.getCurrentWebContents().send('select-file', file)
}