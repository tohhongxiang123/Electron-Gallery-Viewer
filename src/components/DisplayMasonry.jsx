import React from 'react'
import DisplayLocalImage from './DisplayLocalImage'
import styles from './DisplayMasonry.module.scss'
import { Masonry } from 'masonic'

export default function DisplayMasonry({ cols = 2, images, ...props }) {
    return <div {...props} className={styles.masonry}>
        <Masonry
            items={images.map(image => ({ src: image }))}
            render={RenderMasonryCell}
            columnCount={cols}
            overscanBy={2}
        />
    </div>
}

function RenderMasonryCell({ data: { src }}) {
    return <DisplayLocalImage key={src} src={src} className={styles.masonryImageCard} />
}