import { type FC, type ButtonHTMLAttributes } from 'react'
import classNames from 'classnames'

import styles from './button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export const Button: FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  return (
    <button className={classNames(styles.button, styles[variant], className)} {...props}>
      {children}
    </button>
  )
}

export default Button
