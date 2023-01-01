import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLoading, Oval } from '@agney/react-loading'
import { connect } from './redux/blockchain/blockchainActions'
import { fetchData } from './redux/data/dataActions'

import Container from '@mui/material/Container'

import * as s from './styles/globalStyles'
import styled from 'styled-components'
import BN from 'bn.js'

const truncate = (input, len) =>
  input.length > len ? `${input.substring(0, len)}...` : input

export const StyledButton = styled.button`
  padding: 16px 40px;
  border: none;
  background-color: ${(props) => (props.disabled ? '#505050' : '#48e1af')};
  font-weight: bold;
  color: var(--secondary-text);
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`

export const StyledRoundButton = styled.button`
  padding: 10px;
  border-radius: 100%;
  border: none;
  background-color: var(--primary);
  padding: 10px;
  font-weight: bold;
  font-size: 15px;
  color: black;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -webkit-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  -moz-box-shadow: 0px 4px 0px -2px rgba(250, 250, 250, 0.3);
  :active {
    box-shadow: none;
    -webkit-box-shadow: none;
    -moz-box-shadow: none;
  }
`

export const ResponsiveWrapper = styled.div`
  max-width: 500px;
  min-width: 300px;
  justify-content: stretched;
  align-items: stretched;
  @media (min-width: 767px) {
    flex-direction: row;
  }
`

export const StyledImg = styled.img`
  box-shadow: 0px 2px 5px 2px rgba(0, 0, 0);
  border: 4px solid white;
  background-color: var(--accent);
  border-radius: 100%;
  width: 150px;
  margin: 5px;
  @media (max-width: 500px) {
    display: none;
  }
  @media (min-width: 900px) {
    width: 200px;
  }
  @media (min-width: 1000px) {
    width: 250px;
  }
  transition: width 0.5s;
`

export const StyledLink = styled.a`
  color: var(--secondary);
  text-decoration: none;
`

export const BuyButtonContent = styled.div`
  display: flex;
  align-items: center;
`

const Mint = () => {
  const dispatch = useDispatch()
  const blockchain = useSelector((state) => state.blockchain)
  const data = useSelector((state) => state.data)
  const [merkle, setMerkle] = useState([])
  const [claimingNft, setClaimingNft] = useState(false)
  const [feedback, setFeedback] = useState(`Click buy to mint your NFT.`)
  const [isTime, setIsTime] = useState(false)
  const [mintAmount, setMintAmount] = useState(1)
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: '',
    SCAN_LINK: '',
    NETWORK: {
      NAME: '',
      SYMBOL: '',
      ID: 0,
    },
    NFT_NAME: '',
    SYMBOL: '',
    MAX_SUPPLY: 1,
    GAS_LIMIT: 0,
    MARKETPLACE: '',
    MARKETPLACE_LINK: '',
  })

  const getTime = () => {
    let nowDate = new Date()
    let wlDate = new Date(2022, 1, 1, 5, 0)
    let pubDate = new Date(2023, 1, 2, 9, 0)
    //setIsTime(true) //本番では消す
    if (wlDate.getTime() < nowDate.getTime()) {
      setIsTime(true)
    }
  }

  const { indicatorEl } = useLoading({
    loading: claimingNft,
    indicator: <Oval width="24" />,
  })

  const claimNFTs = () => {
    console.log("NFTがclaimされました")
    let cost = data.cost
    let gasLimit = CONFIG.GAS_LIMIT
    let method = null
    let totalCostWei = new BN(cost.toString()).muln(mintAmount)
    let totalGasLimit = String(gasLimit * mintAmount)

    if (mintAmount > 10) {
      alert('上限枚数は10枚までです。')
      return
    }
    setFeedback(`Minting your ${CONFIG.NFT_NAME}...`)
    setClaimingNft(true)
    if (data.presale) {
      console.log(merkle.hexProof)
      method = blockchain.smartContract.methods.preMint(
        mintAmount,
        merkle.hexProof
      )
    } else {
      method = blockchain.smartContract.methods.publicMint(mintAmount)
    }
  
    console.log("method",method)
    method
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once('error', (err) => {
        console.log(err)
        setFeedback('Sorry, something went wrong please try again later.')
        setClaimingNft(false)
      })
      .then((receipt) => {
        console.log(receipt)
        setFeedback(
          `WOW, the ${CONFIG.NFT_NAME} is yours! go visit ${CONFIG.MARKETPLACE} to view it.`
        )
        setClaimingNft(false)
        dispatch(fetchData(blockchain.account))
      })
  }

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1
    if (newMintAmount < 1) {
      newMintAmount = 1
    }
    setMintAmount(newMintAmount)
  }

  const incrementMintAmount = () => {
    const MAX_MINT_AMOUNT = data.presale
      ? CONFIG.MAX_MINT_AMOUNT_PRE
      : CONFIG.MAX_MINT_AMOUNT_PUBLIC
    let newMintAmount = mintAmount + 1
    if (newMintAmount > MAX_MINT_AMOUNT) {
      newMintAmount = MAX_MINT_AMOUNT
    }
    setMintAmount(newMintAmount)
  }

  const getData = () => {
    if (blockchain.account !== '' && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account))
    }
  }
  const getMerkleData = (account) => {
    fetch('/.netlify/functions/merkletree?address=' + account)
      .then((res) => res.json())
      .then(
        (result) => {
          console.log(result)
          setMerkle(result)
        },
        (error) => {
          console.log(error)
        }
      )
      .catch((error) => {
        console.error('通信に失敗しました', error)
      })
  }

  const getConfig = async () => {
    const configResponse = await fetch('/config/config.json', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const config = await configResponse.json()
    SET_CONFIG(config)
  }

  useEffect(() => {
    getConfig()
    getTime()
  }, [])

  useEffect(() => {
    getData()
    
    if (blockchain.account) {
      getMerkleData(blockchain.account)
    }
  }, [blockchain.account])

  const BeforeConnect = () => {
    return (
      <s.Container ai={'center'} jc={'center'}>
        <s.TextDescription
          style={{
            textAlign: 'center',
            color: 'var(--accent-text)',
          }}
        >
          Connect to the {CONFIG.NETWORK.NAME} network
        </s.TextDescription>
        <s.SpacerSmall />
        <StyledButton
          onClick={(e) => {
            e.preventDefault()
            dispatch(connect())
            getData()
          }}
        >
          CONNECT
        </StyledButton>
        {blockchain.errorMsg !== '' ? (
          <>
            <s.SpacerSmall />
            <s.TextDescription
              style={{
                textAlign: 'center',
                color: 'var(--accent-text)',
              }}
            >
              {blockchain.errorMsg}
            </s.TextDescription>
          </>
        ) : null}
      </s.Container>
    )
  }

  const BuyButton = () => {
    if (data.presale && !merkle['hexProof']) {
      return (
        <s.TextDescription
          style={{
            textAlign: 'center',
            color: 'var(--accent-text)',
          }}
        >
          Your address don't eligible WhiteList
        </s.TextDescription>
      )
    }
    return (
      <StyledButton
        disabled={claimingNft ? 1 : 0}
        onClick={(e) => {
          e.preventDefault()
          claimNFTs()
          getData()
        }}
      >
        <BuyButtonContent>{claimingNft ? indicatorEl : 'Buy'}</BuyButtonContent>
      </StyledButton>
    )
  }

  const AftarConnect = () => {
    return (
      <>
        <s.TextTitle
          style={{ textAlign: 'center', color: 'var(--accent-text)' }}
        >
          1 {CONFIG.SYMBOL} costs {data.displayCost} {CONFIG.NETWORK.SYMBOL}.
        </s.TextTitle>
        <s.TextDescription
          style={{ textAlign: 'center', color: 'var(--accent-text)' }}
        >
          {data.presale ? 'PRESALE LIVE!' : 'PUBLIC SALE LIVE!'}
        </s.TextDescription>
        <s.SpacerSmall />
        <s.TextDescription
          style={{
            textAlign: 'center',
            color: 'var(--accent-text)',
          }}
        >
          {feedback}
        </s.TextDescription>
        <s.SpacerMedium />
        <s.Container ai={'center'} jc={'center'} fd={'row'}>
          <StyledRoundButton
            style={{ lineHeight: 0.4 }}
            disabled={claimingNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault()
              decrementMintAmount()
            }}
          >
            -
          </StyledRoundButton>
          <s.SpacerMedium />
          <s.TextDescription
            style={{
              textAlign: 'center',
              color: 'var(--accent-text)',
            }}
          >
            {mintAmount}
          </s.TextDescription>
          <s.SpacerMedium />
          <StyledRoundButton
            disabled={claimingNft ? 1 : 0}
            onClick={(e) => {
              e.preventDefault()
              incrementMintAmount()
            }}
          >
            +
          </StyledRoundButton>
        </s.Container>
        <s.SpacerSmall />
        <s.Container ai={'center'} jc={'center'} fd={'row'}>
          {data.cost ? <BuyButton /> : <div color="#FFFFFF">Loading</div>}
        </s.Container>
      </>
    )
  }

  const MintButton = () => {
    return (
      <React.Fragment>
        <s.SpacerXSmall />
        {blockchain.account === '' || blockchain.smartContract === null ? (
          <BeforeConnect />
        ) : (
          <AftarConnect />
        )}
      </React.Fragment>
    )
  }

  return (
    <>
      <Container
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        <img width="75%" height="10%" src="/config/images/moe.png" />
      </Container>
      <Container
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
        }}
      >
        <StyledImg alt={'example'} src={'/config/images/example.jpg'} />

        <Container
          flex={2}
          jc={'center'}
          ai={'center'}
          style={{
            backgroundColor: 'rgba(2,30,11,0.7)',
            padding: 24,
            borderRadius: 24,
            border: '0px dashed var(--secondary)',
            maxWidth: 450,
            width: '60%',
          }}
        >
          <s.TextTitle
            style={{
              textAlign: 'center',
              color: 'var(--secondary)',
            }}
          >
            Private sale: 1/1 19:00~1/2 7:00<br />
            Public sale: 1/2 9:00~
          </s.TextTitle>
          <s.SpacerSmall />
          <s.TextTitle
            style={{
              textAlign: 'center',
              fontSize: 50,
              fontWeight: 'bold',
              color: 'var(--accent-text)',
            }}
          >
            {data.totalSupply} / {CONFIG.MAX_SUPPLY}
          </s.TextTitle>
          <s.TextDescription
            style={{
              textAlign: 'center',
              color: 'var(--primary-text)',
            }}
          >
            <StyledLink target={'_blank'} href={CONFIG.SCAN_LINK}>
              {truncate(CONFIG.CONTRACT_ADDRESS, 15)}
            </StyledLink>
          </s.TextDescription>
          <s.SpacerSmall />
          {Number(data.totalSupply) >= CONFIG.MAX_SUPPLY ? (
            <s.TextTitle
              style={{ textAlign: 'center', color: 'var(--accent-text)' }}
            >
              The sale has ended.
            </s.TextTitle>
          ) : (
            <MintButton config={CONFIG} />
          )}
          <s.SpacerMedium />
          <s.TextDescription
            style={{ textAlign: 'center', color: 'var(--accent-text)' }}
          >
            NFT Marketplace
          </s.TextDescription>
          <StyledLink target={'_blank'} href={CONFIG.MARKETPLACE_LINK}>
            {CONFIG.MARKETPLACE}
          </StyledLink>
        </Container>
        <StyledImg alt={'example'} src={'/config/images/example.jpg'} />
      </Container>

      <s.SpacerLarge />
      <s.Container>
        <s.TextDescription
          style={{
            textAlign: 'left',
            color: 'var(--accent)',
            marginLeft: '7%',
          }}
        >
          WL Price: 0.00ETH Public Price:0.01ETH
          <br />
          WhiteList Max: 10 NFTs per address
          <br />
          Public Max: 10 NFTs per address
        </s.TextDescription>
        <s.SpacerMedium />
        <s.TextDescription
          style={{
            textAlign: 'left',
            color: 'var(--accent)',
            marginLeft: '7%',
          }}
        >
          Please make sure you are connected to the right network (
          {CONFIG.NETWORK.NAME}) and the correct address. Please note: Once you
          make the purchase, you cannot undo this action.
        </s.TextDescription>
        <s.SpacerLarge />
      </s.Container>
    </>
  )
}

export default Mint
