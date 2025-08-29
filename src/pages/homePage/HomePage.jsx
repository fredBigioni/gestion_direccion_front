import React from 'react'
import { ControlPanel, RegistroGrid } from '../../components'
import useAuth from '../../hooks/useAuth'

export const HomePage = () => {
  const { auth } = useAuth();
  return (
    <>
      <ControlPanel user={auth} />
      <RegistroGrid user={auth} />
    </>
  )
}
