import React from 'react'
import WalletAdapter from '../WalletAdapter'

const Header = () => {
  return (
    <div className=' w-full flex justify-between items-center'>
        <div className=''>
            <h1 className='text-6xl text-white font-bold'>Inscribe.io</h1>
        </div>
        <div className=''>
             <div className=''>
                <WalletAdapter/>
             </div>
        </div>
    </div>
  )
}

export default Header