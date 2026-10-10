import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ImageLightbox, type LightboxImage } from '@/components/common/ImageLightbox'

const images: LightboxImage[] = [
  { src: '/one.jpg', alt: 'First screenshot', label: 'First' },
  { src: '/two.jpg', alt: 'Second screenshot', label: 'Second' },
  { src: '/three.jpg', alt: 'Third screenshot', label: 'Third' },
]

describe('ImageLightbox', () => {
  it('navigates with buttons and thumbnails', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<ImageLightbox images={images} currentIndex={1} onChange={onChange} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: /second image preview/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /next image/i }))
    expect(onChange).toHaveBeenLastCalledWith(2)

    await user.click(screen.getByRole('button', { name: /previous image/i }))
    expect(onChange).toHaveBeenLastCalledWith(0)

    await user.click(screen.getByRole('button', { name: /show third/i }))
    expect(onChange).toHaveBeenLastCalledWith(2)
  })

  it('supports keyboard navigation and closing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onClose = vi.fn()

    render(<ImageLightbox images={images} currentIndex={0} onChange={onChange} onClose={onClose} />)

    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenLastCalledWith(2)

    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenLastCalledWith(1)

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes from the backdrop and close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<ImageLightbox images={images} currentIndex={0} onChange={vi.fn()} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: /close image preview/i }))
    expect(onClose).toHaveBeenCalledOnce()

    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
