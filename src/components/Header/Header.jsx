import React, { useContext } from 'react';
import { Icon } from 'semantic-ui-react';
import { ThemeContext } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);

    return (
        <header className="app-header" data-aos="fade-down">
            <h1 className="header-title">Vocal Remover</h1>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
                <Icon name={theme === 'dark' ? 'sun' : 'moon'} size="large" />
            </button>
        </header>
    );
};

export default Header;
