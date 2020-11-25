import React, { useState, useRef, useEffect } from 'react'
import Masonry from 'react-masonry-css'
import DisplayLocalImage from './DisplayLocalImage'
import styles from './DisplayMasonry.module.scss'

const STEP = 10
export default function DisplayMasonry({ cols = 2, images, ...props }) {
    const [endIndex, setEndIndex] = useState(STEP)
    const endingRef = useRef(null)
    const observer = useRef(null)

    const loadMoreImages = () => {
        setEndIndex(c => c + STEP)
    }

    useEffect(() => {
        const options = { rootMargin: '1500px', threshold: 0 }
        const callback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadMoreImages()
                }
            })
        }

        let currentObserver = observer.current
        if (!currentObserver) {
            currentObserver = new IntersectionObserver(callback, options)
        }

        const currentEndingRef = endingRef.current
        if (currentEndingRef) currentObserver.observe(currentEndingRef)
        return () => {
            currentObserver.unobserve(currentEndingRef)
        }
    }, [])

    return (
        <div {...props}>
            <Masonry breakpointCols={cols} className={styles.masonry} columnClassName="">
                {images.slice(0, endIndex).map(image => <DisplayLocalImage key={image} src={image} />)}
            </Masonry>
            <button id="ending" ref={endingRef} className="button is-primary" style={{ display: 'block', margin: '1rem auto' }} onClick={loadMoreImages}>Load more</button>
        </div>
    )
}
