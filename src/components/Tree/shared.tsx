import styled from 'styled-components';

export const TreeViewport = styled.div<{ $height: number }>`
  height: ${(props) => props.$height}px;
  width: 100%;
  overflow: auto;
  border: 1px solid #dde0df;
  background: #ffffff;
`;

export const PlainTreeInner = styled.div`
  min-width: max-content;
  padding-top: 8px;
`;
