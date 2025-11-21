import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Content } from '../components/Layout'
import { HistoryHeader } from '../components/HistoryHeader'
import { HistoryList } from '../components/HistoryList'
import { getGroupsByLap, type Group } from '../services/api'

export type HistoryItem = {
  id: number
  date: string
  group: Group
}

export function HistoryPage() {
  const { lapId } = useParams<{ lapId: string }>()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadHistory = async () => {
      if (!lapId) {
        setError('ЛЭП не указан')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const groups = await getGroupsByLap(lapId)
        
        // Преобразуем группы в элементы истории
        const items: HistoryItem[] = groups.map((group) => ({
          id: group.id,
          date: group.create_at,
          group,
        }))
        
        // Сортируем по дате (новые сверху)
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setHistoryItems(items)
      } catch (err) {
        console.error('[HistoryPage] Failed to load history:', err)
        setError(err instanceof Error ? err.message : 'Не удалось загрузить историю')
        setHistoryItems([])
      } finally {
        setLoading(false)
      }
    }

    void loadHistory()
  }, [lapId])

  const handleView = (index: number) => {
    const item = historyItems[index]
    if (!lapId) return
    
    // Переходим на страницу неисправностей с указанием group_id
    navigate(`/line/${lapId}/issues?group_id=${item.group.id}`)
  }

  return (
    <>
      <HistoryHeader />
      <Content>
        {loading ? (
          <div style={{ 
            padding: '80px 24px', 
            textAlign: 'center', 
            color: '#9d9b97',
            fontFamily: 'Inter, sans-serif',
            fontSize: '28px'
          }}>
            Загрузка истории...
          </div>
        ) : error ? (
          <div style={{ 
            padding: '80px 24px', 
            textAlign: 'center', 
            color: '#de6f6d',
            fontFamily: 'Inter, sans-serif',
            fontSize: '28px'
          }}>
            {error}
          </div>
        ) : (
          <HistoryList
            items={historyItems}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onView={handleView}
          />
        )}
      </Content>
    </>
  )
}

