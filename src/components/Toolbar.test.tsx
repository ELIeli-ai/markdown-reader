import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Toolbar } from './Toolbar'

afterEach(cleanup)

function createProps() {
  return {
    fileName: '示例.md',
    isLoading: false,
    viewMode: 'split' as const,
    zoomPercent: 100,
    onNew: vi.fn(),
    onOpen: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onViewModeChange: vi.fn(),
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn()
  }
}

describe('Toolbar', () => {
  it('把文件操作折叠在菜单中，并在执行后关闭菜单', async () => {
    const user = userEvent.setup()
    const props = createProps()
    render(<Toolbar {...props} />)

    expect(screen.queryByRole('button', { name: '新建' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '文件' }))
    await user.click(screen.getByRole('button', { name: '新建' }))

    expect(props.onNew).toHaveBeenCalledOnce()
    expect(screen.queryByRole('button', { name: '新建' })).not.toBeInTheDocument()
  })

  it('提供编辑、双栏、预览切换和缩放控制', async () => {
    const user = userEvent.setup()
    const props = createProps()
    render(<Toolbar {...props} />)

    expect(screen.getByRole('button', { name: '双栏' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '预览' }))
    await user.click(screen.getByRole('button', { name: '放大内容' }))
    await user.click(screen.getByRole('button', { name: '100%' }))

    expect(props.onViewModeChange).toHaveBeenCalledWith('preview')
    expect(props.onZoomIn).toHaveBeenCalledOnce()
    expect(props.onZoomReset).toHaveBeenCalledOnce()
  })
})
