import React from 'react';
import { Layout, Typography } from 'antd';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#f0f2f5', paddingLeft: '20rem' }}>
      <Text type="secondary">
        © {new Date().getFullYear()} Navikenz | All rights reserved.
      </Text>
    </AntFooter>
  );
};

export default Footer;