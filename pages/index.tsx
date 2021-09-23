import type { NextPage } from 'next'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import styles from '../styles/Home.module.css'
import { Video } from '../components'

const VideoWithNoSSR = dynamic(
  () => import('../components/video'),
  { ssr: false }
)

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Whatever Demo</title>
        <meta name="description" content="Zzz" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Hello World!
        </h1>
        <VideoWithNoSSR /> 
      </main>
    </div>
  )
}

export default Home
