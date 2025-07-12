import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {

    return (
      <header>
        <nav className='bg-white'>
          <div className='lg:mx-10 md:mx-8 sm:mx-4 px-4 py-3 flex justify-between items-center'>
            <h1 className='text-2xl font-bold py-2 text-gray-900'><Link to={'/'}>SpeechScore</Link></h1>
            <div className='flex justify-between items-center gap-4 px-4 py-2 rounded-lg'>
              <h1 className='font-medium text-gray-700 px-2 py-2 hover:text-indigo-700 transition'><Link to={'/'}>How It Works</Link></h1>
              <h1 className='bg-indigo-600 text-white font-medium px-5 py-3 rounded-full hover:bg-indigo-700 transition'><Link to={'/analyze'}>Upload or Record Speech</Link></h1>
            </div>
          </div>
        </nav>
      </header>
    )

}
