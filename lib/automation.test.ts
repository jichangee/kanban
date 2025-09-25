import { executeAutomationRules, mergeAndDeduplicateLinks, clearAllExecutionCache } from './automation';

// 模拟测试数据
const mockRules = [
  {
    id: 'rule1',
    name: 'GitHub Issue',
    regex: '#(\\d+)',
    linkTemplate: 'https://github.com/user/repo/issues/$1',
    userId: 'user1'
  },
  {
    id: 'rule2',
    name: 'JIRA Ticket',
    regex: 'JIRA-(\\d+)',
    linkTemplate: 'https://company.atlassian.net/browse/JIRA-$1',
    userId: 'user1'
  }
];

// 模拟数据库查询
jest.mock('./db', () => ({
  db: {
    query: jest.fn().mockResolvedValue({
      rows: mockRules
    })
  }
}));

describe('Automation Rules', () => {
  beforeEach(() => {
    clearAllExecutionCache();
    jest.clearAllMocks();
  });

  test('should execute rules only once for the same content', async () => {
    const content = 'Fix issue #123 and JIRA-456';
    const userId = 'user1';
    
    // 第一次执行
    const result1 = await executeAutomationRules(content, userId);
    expect(result1).toHaveLength(2);
    expect(result1).toContain('https://github.com/user/repo/issues/123');
    expect(result1).toContain('https://company.atlassian.net/browse/JIRA-456');
    
    // 第二次执行相同内容，应该返回空数组（规则已执行过）
    const result2 = await executeAutomationRules(content, userId);
    expect(result2).toHaveLength(0);
  });

  test('should merge and deduplicate links correctly', () => {
    const existingLinks = ['https://example.com'];
    const userSubmittedLinks = ['https://user.com', 'https://example.com'];
    const generatedLinks = ['https://generated.com', 'https://user.com'];
    
    const result = mergeAndDeduplicateLinks(existingLinks, userSubmittedLinks, generatedLinks);
    
    expect(result).toHaveLength(3);
    expect(result).toContain('https://example.com');
    expect(result).toContain('https://user.com');
    expect(result).toContain('https://generated.com');
  });

  test('should handle empty arrays correctly', () => {
    const result = mergeAndDeduplicateLinks();
    expect(result).toHaveLength(0);
    
    const result2 = mergeAndDeduplicateLinks(['link1'], [], ['link2']);
    expect(result2).toHaveLength(2);
  });
});
