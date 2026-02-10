import React from 'react'
import styles from './index.module.scss'

interface FileNameItemProps {
    value: string
    actived: boolean
    onClick: (value: string) => void,
}

export default function FileNameItem(props: FileNameItemProps) {
    const { value, actived, onClick } = props;
    return (
        <div className={`${styles['tab-item']} ${actived ? styles['actived'] : ''}`} onClick={() => onClick(value)}>
            <span>{value}</span>
        </div>
    )
}