import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import ImageCanvas from "../components/ImageCanvas";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Neural Style Transfer</title>
        <meta name="description" content="Apply artistic styles to images using ONNX Runtime Web" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Neural Style Transfer
        </h1>
        <p className={styles.description}>
          Transform your images with artistic styles using AI
        </p>

        <ImageCanvas />
      </main>

      <footer className={styles.footer}>
        <a
          href="https://onnxruntime.ai/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by ONNX Runtime Web
        </a>
      </footer>
    </div>
  )
}

export default Home
