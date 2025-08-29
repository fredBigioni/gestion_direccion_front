import React from 'react'

export const RegistroGridFooterActions = ({ user }) => {
  return (
    <>
      {
        user.rol.name.toLowerCase() == 'carga' ? <>
          <th>
            -
          </th>
        </> :
          <></>
      }
    </>
  )
}
