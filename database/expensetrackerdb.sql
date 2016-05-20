-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 19, 2016 at 10:16 AM
-- Server version: 5.5.49-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `expensetrackerdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE IF NOT EXISTS `category` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Table Primary Key',
  `category_name` varchar(50) NOT NULL COMMENT 'Category Name',
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `category_budget`
--

CREATE TABLE IF NOT EXISTS `category_budget` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Table Primary Key',
  `user_id` varchar(255) NOT NULL COMMENT 'Amazon Echo userId',
  `category_id` int(10) unsigned NOT NULL COMMENT 'Category ID Foreign Key',
  `amount` float NOT NULL COMMENT 'Budget Amount Set',
  `month` date NOT NULL COMMENT 'Budget for Month',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2 ;

--
-- Dumping data for table `category_budget`
--

INSERT INTO `category_budget` (`id`, `user_id`, `category_id`, `amount`, `month`) VALUES
(1, 'abcd', 1, 50, '2016-05-00');

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Table Primary Key',
  `user_id` varchar(255) NOT NULL COMMENT 'Amazon Echo userId',
  `category_id` int(10) unsigned NOT NULL COMMENT 'Category ID Foreign Key',
  `amount` float NOT NULL COMMENT 'Amount Spent',
  `date` date NOT NULL COMMENT 'Date of Expense',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='Expenditure Table' AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `overall_budget`
--

CREATE TABLE IF NOT EXISTS `overall_budget` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT 'Table Primary Key',
  `user_id` varchar(255) NOT NULL COMMENT 'Amazon Echo userId',
  `amount` float NOT NULL COMMENT 'Budget Amount Set',
  `month` date NOT NULL COMMENT 'Budget set for month',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
