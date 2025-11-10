-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-11-2025 a las 15:01:42
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `topologia`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `connections`
--

CREATE TABLE `connections` (
  `id` int(11) NOT NULL,
  `network_id` int(11) NOT NULL,
  `from_device_id` int(11) NOT NULL,
  `a_port_id` int(11) DEFAULT NULL,
  `to_device_id` int(11) NOT NULL,
  `b_port_id` int(11) DEFAULT NULL,
  `link_type` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `from_id_norm` int(11) GENERATED ALWAYS AS (least(`from_device_id`,`to_device_id`)) STORED,
  `to_id_norm` int(11) GENERATED ALWAYS AS (greatest(`from_device_id`,`to_device_id`)) STORED,
  `a_port_name` varchar(64) DEFAULT NULL,
  `b_port_name` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `connections`
--

INSERT INTO `connections` (`id`, `network_id`, `from_device_id`, `a_port_id`, `to_device_id`, `b_port_id`, `link_type`, `status`, `created_at`, `a_port_name`, `b_port_name`) VALUES
(241, 1, 149, 81, 150, 91, 'ethernet', 'up', '2025-11-06 17:42:38', 'Fa0/1', 'Fa0/1'),
(243, 1, 145, 31, 146, 48, 'ethernet', 'up', '2025-11-07 14:05:32', 'Gi0/1', 'Gi0/3'),
(244, 1, 151, 110, 149, 86, 'ethernet', 'up', '2025-11-07 14:15:19', 'Gi0/5', 'Fa0/6');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `devices`
--

CREATE TABLE `devices` (
  `id` int(11) NOT NULL,
  `network_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `mac_address` varchar(50) DEFAULT NULL,
  `device_type` varchar(50) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `image_id` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `site_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `devices`
--

INSERT INTO `devices` (`id`, `network_id`, `name`, `ip_address`, `mac_address`, `device_type`, `location`, `image_id`, `metadata`, `created_at`, `updated_at`, `site_id`) VALUES
(145, 1, '313131', '198.111.1.1', 'f3:2f:9d:ae:ac:96', 'switch', 'SALA 3', NULL, '{\"pos\":{\"x\":687.058142253606,\"y\":286.76679123411446}}', '2025-11-06 14:16:27', '2025-11-07 14:46:19', 4),
(146, 1, 'SWITCHE', '198.168.1.1', 'f3:2f:9d:ae:ac:96', 'switch', 'SALA 4', NULL, '{\"pos\":{\"x\":515.8257953292101,\"y\":5.615521877611928}}', '2025-11-06 14:17:21', '2025-11-07 17:09:54', 3),
(149, 1, 'WIFI', '198.168.1.1', '0d:21:93:cc:86:fd', 'ap', 'SADASDA', NULL, '{\"pos\":{\"x\":879.0877124782186,\"y\":96.79691940948472}}', '2025-11-06 17:32:45', '2025-11-07 14:46:30', 4),
(150, 1, 'ERRARA', '198.168.1.1', '0d:21:93:cc:86:fd', 'ap', 'DASDA', NULL, '{\"pos\":{\"x\":405.2094931989558,\"y\":278.587202318222}}', '2025-11-06 17:41:57', '2025-11-07 14:46:22', 2),
(151, 1, 'DASDA', '198.168.1.1', '44:b5:b0:09:6d:e8', 'ap', 'sala 3', NULL, '{\"pos\":{\"x\":832.2369687886597,\"y\":509.13619287485676}}', '2025-11-07 14:15:08', '2025-11-07 14:46:29', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `device_positions`
--

CREATE TABLE `device_positions` (
  `id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `view` enum('wifi','switch') NOT NULL,
  `x` double NOT NULL,
  `y` double NOT NULL,
  `zoom` double DEFAULT NULL,
  `pan_x` double DEFAULT NULL,
  `pan_y` double DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `images`
--

CREATE TABLE `images` (
  `id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` bigint(20) NOT NULL,
  `path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `images`
--

INSERT INTO `images` (`id`, `file_name`, `mime_type`, `size_bytes`, `path`, `created_at`) VALUES
(1, 'Tulips.jpg', 'image/jpeg', 620888, 'C:/Users/TelGefferson/topologia-corpoelec/uploads/1761839539346-Tulips.jpg', '2025-10-30 15:52:19'),
(2, 'Koala.jpg', 'image/jpeg', 780831, 'C:/Users/TelGefferson/topologia-corpoelec/uploads/1761839550584-Koala.jpg', '2025-10-30 15:52:30'),
(4, 'Chrysanthemum.jpg', 'image/jpeg', 879394, 'C:/Users/TelGefferson/topologia-corpoelec/uploads/1761850774789-Chrysanthemum.jpg', '2025-10-30 18:59:34'),
(5, 'Estrctura 1.PNG', 'image/png', 14536, 'C:/Users/TelGefferson/topologia-corpoelec/uploads/1761925208648-Estrctura 1.PNG', '2025-10-31 15:40:08');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `login_attempts`
--

CREATE TABLE `login_attempts` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `login_attempts`
--

INSERT INTO `login_attempts` (`id`, `user_id`, `username`, `ip`, `success`, `created_at`) VALUES
(1, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:07:36'),
(2, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:13:13'),
(3, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:13:19'),
(4, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:13:33'),
(5, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:16:07'),
(6, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:27:01'),
(7, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-15 13:27:17'),
(8, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-15 13:30:57'),
(9, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-15 13:32:45'),
(10, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-15 16:42:59'),
(11, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-16 14:48:57'),
(12, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-16 15:01:55'),
(13, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-16 15:02:31'),
(14, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-16 15:02:34'),
(15, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-16 15:02:35'),
(16, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-16 15:02:35'),
(17, 1, 'admin', '::ffff:127.0.0.1', 0, '2025-10-16 15:02:35'),
(18, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:17:05'),
(19, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:17:30'),
(20, 1, 'admin', '::1', 0, '2025-10-20 17:17:48'),
(21, 1, 'admin', '::1', 1, '2025-10-20 17:18:01'),
(22, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:25:17'),
(23, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:26:42'),
(24, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:30:42'),
(25, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 17:44:43'),
(26, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 18:12:43'),
(27, 1, 'admin', '::1', 1, '2025-10-20 18:42:06'),
(28, 1, 'admin', '::1', 1, '2025-10-20 18:45:23'),
(29, 1, 'admin', '::1', 0, '2025-10-20 18:45:35'),
(30, 1, 'admin', '::1', 1, '2025-10-20 18:45:38'),
(31, 1, 'admin', '::1', 1, '2025-10-20 18:45:46'),
(32, 1, 'admin', '::1', 1, '2025-10-20 18:49:23'),
(33, 1, 'admin', '::1', 1, '2025-10-20 18:49:45'),
(34, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 18:53:59'),
(35, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-20 18:54:56'),
(36, 1, 'admin', '::1', 1, '2025-10-22 13:29:23'),
(37, 1, 'admin', '::1', 1, '2025-10-22 13:31:40'),
(38, 1, 'admin', '::1', 1, '2025-10-22 13:32:03'),
(39, 1, 'admin', '::1', 1, '2025-10-22 14:04:45'),
(40, 3, 'normal', '::1', 1, '2025-10-22 14:05:02'),
(41, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:06:36'),
(42, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:09:32'),
(43, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:09:47'),
(44, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:09:55'),
(45, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 14:12:23'),
(46, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:30:33'),
(47, 3, 'normal', '::ffff:127.0.0.1', 0, '2025-10-22 14:31:08'),
(48, 3, 'normal', '::ffff:127.0.0.1', 0, '2025-10-22 14:31:14'),
(49, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 14:31:18'),
(50, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 14:37:19'),
(51, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 14:37:40'),
(52, 1, 'admin', '::1', 1, '2025-10-22 15:00:17'),
(53, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 15:00:21'),
(54, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 17:33:15'),
(55, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 17:33:33'),
(56, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 17:33:57'),
(57, 3, 'normal', '::ffff:127.0.0.1', 1, '2025-10-22 17:38:32'),
(58, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 17:47:01'),
(59, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-22 18:16:36'),
(60, 1, 'admin', '::1', 1, '2025-10-22 18:38:37'),
(61, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-23 13:04:27'),
(62, 1, 'admin', '::1', 1, '2025-10-23 13:08:18'),
(63, 1, 'admin', '::1', 1, '2025-10-23 13:19:00'),
(64, 1, 'admin', '::1', 1, '2025-10-23 13:29:46'),
(65, 3, 'normal', '::1', 1, '2025-10-23 14:22:52'),
(66, 3, 'normal', '::1', 1, '2025-10-23 14:31:51'),
(67, 3, 'normal', '::1', 1, '2025-10-23 14:37:16'),
(68, 3, 'normal', '::1', 1, '2025-10-23 14:37:18'),
(69, 3, 'normal', '::1', 1, '2025-10-23 14:37:21'),
(70, 1, 'admin', '::1', 1, '2025-10-23 14:37:23'),
(71, 1, 'admin', '::1', 1, '2025-10-23 14:37:37'),
(72, 1, 'admin', '::1', 1, '2025-10-23 14:38:03'),
(73, 1, 'admin', '::1', 1, '2025-10-23 16:20:55'),
(74, 1, 'admin', '::1', 1, '2025-10-23 16:20:56'),
(75, 1, 'admin', '::1', 1, '2025-10-23 16:21:16'),
(76, 1, 'admin', '::1', 1, '2025-10-23 16:46:27'),
(77, 1, 'admin', '::1', 1, '2025-10-23 16:46:52'),
(78, 1, 'admin', '::1', 1, '2025-10-23 16:49:25'),
(79, 1, 'admin', '::1', 1, '2025-10-23 16:49:29'),
(80, 1, 'admin', '::1', 1, '2025-10-23 16:49:56'),
(81, 1, 'admin', '::1', 1, '2025-10-23 16:57:29'),
(82, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-23 17:41:11'),
(83, 3, 'normal', '::ffff:127.0.0.1', 0, '2025-10-23 17:41:50'),
(84, 3, 'normal', '::ffff:127.0.0.1', 0, '2025-10-23 17:41:55'),
(85, 3, 'normal', '::ffff:127.0.0.1', 0, '2025-10-23 17:42:01'),
(86, 1, 'admin', '::1', 1, '2025-10-23 17:43:31'),
(87, 1, 'admin', '::1', 1, '2025-10-23 18:05:10'),
(88, 1, 'admin', '::1', 1, '2025-10-23 18:06:05'),
(89, 1, 'admin', '::1', 1, '2025-10-23 18:06:10'),
(90, 1, 'admin', '::1', 1, '2025-10-23 18:49:35'),
(91, 3, 'normal', '::1', 1, '2025-10-23 19:06:55'),
(92, 3, 'normal', '::1', 1, '2025-10-24 13:03:05'),
(93, 1, 'admin', '::1', 1, '2025-10-24 13:03:11'),
(94, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-24 13:16:45'),
(95, 1, 'admin', '::1', 1, '2025-10-24 13:30:02'),
(96, 1, 'admin', '::1', 1, '2025-10-24 16:13:01'),
(97, 1, 'admin', '::1', 1, '2025-10-24 16:15:41'),
(98, 1, 'admin', '::1', 1, '2025-10-24 16:15:55'),
(99, 1, 'admin', '::1', 1, '2025-10-24 16:21:14'),
(100, 3, 'normal', '::1', 1, '2025-10-27 12:58:13'),
(101, 3, 'normal', '::1', 1, '2025-10-27 13:00:32'),
(102, 3, 'normal', '::1', 1, '2025-10-27 13:57:49'),
(103, 3, 'normal', '::1', 1, '2025-10-27 13:58:02'),
(104, 1, 'admin', '::1', 1, '2025-10-27 13:58:08'),
(105, 1, 'admin', '::1', 1, '2025-10-27 14:04:14'),
(106, 3, 'normal', '::1', 1, '2025-10-27 14:23:06'),
(107, 1, 'admin', '::1', 1, '2025-10-27 14:23:22'),
(108, 1, 'admin', '::1', 1, '2025-10-27 14:50:09'),
(109, 3, 'normal', '::1', 1, '2025-10-27 14:51:56'),
(110, 3, 'normal', '::1', 1, '2025-10-27 15:07:50'),
(111, 1, 'admin', '::1', 1, '2025-10-27 15:16:08'),
(112, 1, 'admin', '::1', 1, '2025-10-27 15:48:06'),
(113, 1, 'admin', '::1', 1, '2025-10-27 15:48:41'),
(114, 1, 'admin', '::1', 1, '2025-10-27 17:43:54'),
(115, 3, 'normal', '::1', 1, '2025-10-27 17:48:18'),
(116, 1, 'admin', '::1', 1, '2025-10-27 17:48:23'),
(117, 3, 'normal', '::1', 1, '2025-10-27 17:49:11'),
(118, 1, 'admin', '::1', 1, '2025-10-27 18:35:43'),
(119, 1, 'admin', '::1', 1, '2025-10-27 19:17:51'),
(120, 1, 'admin', '::1', 1, '2025-10-27 19:19:53'),
(121, 1, 'admin', '::1', 1, '2025-10-27 19:24:10'),
(122, 1, 'admin', '::1', 1, '2025-10-27 19:29:09'),
(123, 3, 'normal', '::1', 1, '2025-10-28 13:42:52'),
(124, 1, 'admin', '::1', 1, '2025-10-28 13:42:58'),
(125, 1, 'admin', '::1', 1, '2025-10-28 14:03:31'),
(126, 1, 'admin', '::1', 1, '2025-10-28 14:39:51'),
(127, 1, 'admin', '::1', 1, '2025-10-28 14:39:53'),
(128, 1, 'admin', '::1', 1, '2025-10-28 14:39:54'),
(129, 1, 'admin', '::1', 1, '2025-10-28 14:41:04'),
(130, 1, 'admin', '::1', 1, '2025-10-28 14:41:05'),
(131, 1, 'admin', '::1', 1, '2025-10-28 14:41:28'),
(132, 1, 'admin', '::1', 1, '2025-10-28 14:41:29'),
(133, 1, 'admin', '::1', 1, '2025-10-28 14:41:30'),
(134, 1, 'admin', '::1', 1, '2025-10-28 14:42:06'),
(135, 1, 'admin', '::1', 1, '2025-10-28 14:42:46'),
(136, 1, 'admin', '::1', 1, '2025-10-28 14:43:14'),
(137, 1, 'admin', '::1', 1, '2025-10-28 14:43:44'),
(138, 1, 'admin', '::1', 1, '2025-10-28 14:43:49'),
(139, 1, 'admin', '::1', 1, '2025-10-28 14:44:26'),
(140, 1, 'admin', '::1', 1, '2025-10-28 14:44:43'),
(141, 1, 'admin', '::1', 1, '2025-10-28 14:44:45'),
(142, 1, 'admin', '::1', 1, '2025-10-28 14:44:45'),
(143, 1, 'admin', '::1', 1, '2025-10-28 14:44:46'),
(144, 1, 'admin', '::1', 1, '2025-10-28 14:44:55'),
(145, 1, 'admin', '::1', 1, '2025-10-28 14:44:56'),
(146, 1, 'admin', '::1', 1, '2025-10-28 14:44:57'),
(147, 1, 'admin', '::1', 1, '2025-10-28 14:45:12'),
(148, 1, 'admin', '::1', 1, '2025-10-28 18:13:44'),
(149, 1, 'admin', '::1', 1, '2025-10-28 18:14:43'),
(150, 3, 'normal', '::1', 1, '2025-10-28 18:16:56'),
(151, 1, 'admin', '::1', 1, '2025-10-28 18:17:54'),
(152, 1, 'admin', '::1', 1, '2025-10-28 19:06:07'),
(153, 3, 'normal', '::1', 1, '2025-10-29 15:07:52'),
(154, 1, 'admin', '::1', 1, '2025-10-29 15:08:25'),
(155, 1, 'admin', '::1', 1, '2025-10-29 16:39:38'),
(156, 1, 'admin', '::1', 1, '2025-10-29 18:17:59'),
(157, 1, 'admin', '::1', 1, '2025-10-29 18:30:33'),
(158, 1, 'admin', '::ffff:127.0.0.1', 1, '2025-10-30 13:31:44'),
(159, 1, 'admin', '::1', 1, '2025-10-30 14:33:06'),
(160, 1, 'admin', '::1', 1, '2025-10-30 14:59:59'),
(161, 1, 'admin', '::1', 1, '2025-10-30 15:21:50'),
(162, 3, 'normal', '::1', 1, '2025-10-30 15:22:21'),
(163, 3, 'normal', '::1', 1, '2025-10-30 15:25:37'),
(164, 1, 'admin', '::1', 1, '2025-10-30 15:27:44'),
(165, 1, 'admin', '::1', 1, '2025-10-30 15:32:12'),
(166, 1, 'admin', '::1', 1, '2025-10-30 16:24:07'),
(167, 1, 'admin', '::1', 1, '2025-10-30 17:49:11'),
(168, 1, 'admin', '::1', 1, '2025-10-30 17:53:37'),
(169, 1, 'admin', '::1', 1, '2025-10-30 17:54:27'),
(170, 3, 'normal', '::1', 1, '2025-10-30 17:54:36'),
(171, 1, 'admin', '::1', 1, '2025-10-30 18:02:18'),
(172, 1, 'admin', '::1', 1, '2025-10-30 18:08:35'),
(173, 1, 'admin', '::1', 1, '2025-10-30 18:13:53'),
(174, 1, 'admin', '::1', 1, '2025-10-30 18:14:43'),
(175, 1, 'admin', '::1', 1, '2025-10-30 18:23:06'),
(176, 1, 'admin', '::1', 1, '2025-10-30 18:24:14'),
(177, 1, 'admin', '::1', 1, '2025-10-30 18:26:44'),
(178, 1, 'admin', '::1', 1, '2025-10-30 18:33:08'),
(179, 1, 'admin', '::1', 1, '2025-10-30 18:59:12'),
(180, 1, 'admin', '::1', 1, '2025-10-30 19:01:23'),
(181, 3, 'normal', '::1', 1, '2025-10-31 14:34:05'),
(182, 1, 'admin', '::1', 1, '2025-10-31 14:34:13'),
(183, 1, 'admin', '::1', 1, '2025-10-31 15:24:32'),
(184, 1, 'admin', '::1', 1, '2025-11-03 15:02:29'),
(185, 1, 'admin', '::1', 1, '2025-11-04 17:38:12'),
(186, 1, 'admin', '::1', 1, '2025-11-06 14:37:03'),
(187, 1, 'admin', '::1', 1, '2025-11-06 14:37:21'),
(188, 1, 'admin', '::1', 1, '2025-11-06 14:56:23'),
(189, 1, 'admin', '::1', 1, '2025-11-06 15:44:30'),
(190, 1, 'admin', '::1', 1, '2025-11-06 15:56:28'),
(191, 1, 'admin', '::1', 1, '2025-11-06 17:31:21'),
(192, 1, 'admin', '::1', 1, '2025-11-07 13:24:19'),
(193, 1, 'admin', '::1', 1, '2025-11-07 13:57:54'),
(194, 1, 'admin', '::1', 1, '2025-11-07 14:10:08'),
(195, 1, 'admin', '::1', 1, '2025-11-07 14:11:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `networks`
--

CREATE TABLE `networks` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` enum('wifi','switch') NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `networks`
--

INSERT INTO `networks` (`id`, `name`, `type`, `description`, `created_at`) VALUES
(1, 'Red WiFi Principal', 'wifi', 'Cobertura WiFi', '2025-10-14 17:51:23'),
(2, 'Backbone de Switches', 'switch', 'Distribución cableada', '2025-10-14 17:51:23'),
(3, 'AP-01', 'wifi', NULL, '2025-10-22 17:37:00'),
(4, 'test', '', NULL, '2025-10-23 16:57:17'),
(5, 'ConexioN Nueva', 'switch', NULL, '2025-10-23 17:45:05'),
(6, 'Router', 'switch', 'DJASDJASJDA', '2025-10-27 14:22:19'),
(7, 'Router', 'switch', 'adsada', '2025-10-27 14:23:32'),
(8, 'Router', 'wifi', 'adsada', '2025-10-27 14:23:34'),
(9, 'SWTICHES', 'wifi', 'DASDASDA', '2025-10-27 18:37:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ping_logs`
--

CREATE TABLE `ping_logs` (
  `id` bigint(20) NOT NULL,
  `device_id` int(11) NOT NULL,
  `success` tinyint(1) NOT NULL,
  `latency_ms` int(11) DEFAULT NULL,
  `ran_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ports`
--

CREATE TABLE `ports` (
  `id` int(11) NOT NULL,
  `device_id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `kind` enum('fast-ethernet','gigabit-ethernet','wifi','sfp','sfp+','other') DEFAULT 'other',
  `speed_mbps` int(11) DEFAULT NULL,
  `admin_status` enum('up','down') DEFAULT 'up',
  `oper_status` enum('up','down') DEFAULT 'down',
  `position` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ports`
--

INSERT INTO `ports` (`id`, `device_id`, `name`, `kind`, `speed_mbps`, `admin_status`, `oper_status`, `position`, `notes`, `created_at`, `updated_at`) VALUES
(31, 145, 'Gi0/1', 'gigabit-ethernet', 1000, 'up', 'down', 1, NULL, '2025-11-06 14:16:27', '2025-11-06 14:53:54'),
(32, 145, 'Gi0/2', 'gigabit-ethernet', 1000, 'up', 'down', 2, NULL, '2025-11-06 14:16:27', '2025-11-06 14:16:27'),
(33, 145, 'Gi0/3', 'gigabit-ethernet', 1000, 'up', 'down', 3, NULL, '2025-11-06 14:16:27', '2025-11-06 14:16:27'),
(34, 145, 'Gi0/4', 'gigabit-ethernet', 1000, 'up', 'down', 4, NULL, '2025-11-06 14:16:27', '2025-11-06 14:16:27'),
(35, 145, 'Gi0/5', 'gigabit-ethernet', 1000, 'up', 'down', 5, NULL, '2025-11-06 14:16:27', '2025-11-06 14:16:27'),
(36, 145, 'Gi0/6', 'gigabit-ethernet', 1000, 'up', 'down', 6, NULL, '2025-11-06 14:16:27', '2025-11-06 14:16:27'),
(37, 145, 'Gi0/7', 'gigabit-ethernet', 1000, 'up', 'down', 7, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(38, 145, 'Gi0/8', 'gigabit-ethernet', 1000, 'up', 'down', 8, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(39, 145, 'Gi0/9', 'gigabit-ethernet', 1000, 'up', 'down', 9, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(40, 145, 'Gi0/10', 'gigabit-ethernet', 1000, 'up', 'down', 10, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(41, 145, 'Gi0/11', 'gigabit-ethernet', 1000, 'up', 'down', 11, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(42, 145, 'Gi0/12', 'gigabit-ethernet', 1000, 'up', 'down', 12, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(43, 145, 'Gi0/13', 'gigabit-ethernet', 1000, 'up', 'down', 13, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(44, 145, 'Gi0/14', 'gigabit-ethernet', 1000, 'up', 'down', 14, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(45, 145, 'Gi0/15', 'gigabit-ethernet', 1000, 'up', 'down', 15, NULL, '2025-11-06 14:16:28', '2025-11-06 14:16:28'),
(46, 146, 'Gi0/1', 'gigabit-ethernet', 1000, 'up', 'down', 1, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(47, 146, 'Gi0/2', 'gigabit-ethernet', 1000, 'up', 'down', 2, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(48, 146, 'Gi0/3', 'gigabit-ethernet', 1000, 'up', 'down', 3, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(49, 146, 'Gi0/4', 'gigabit-ethernet', 1000, 'up', 'down', 4, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(50, 146, 'Gi0/5', 'gigabit-ethernet', 1000, 'up', 'down', 5, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(51, 146, 'Gi0/6', 'gigabit-ethernet', 1000, 'up', 'down', 6, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(52, 146, 'Gi0/7', 'gigabit-ethernet', 1000, 'up', 'down', 7, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(53, 146, 'Gi0/8', 'gigabit-ethernet', 1000, 'up', 'down', 8, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(54, 146, 'Gi0/9', 'gigabit-ethernet', 1000, 'up', 'down', 9, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(55, 146, 'Gi0/10', 'gigabit-ethernet', 1000, 'up', 'down', 10, NULL, '2025-11-06 14:17:22', '2025-11-06 14:17:22'),
(81, 149, 'Fa0/1', 'fast-ethernet', 100, 'up', 'down', 1, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(82, 149, 'Fa0/2', 'fast-ethernet', 100, 'up', 'down', 2, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(83, 149, 'Fa0/3', 'fast-ethernet', 100, 'up', 'down', 3, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(84, 149, 'Fa0/4', 'fast-ethernet', 100, 'up', 'down', 4, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(85, 149, 'Fa0/5', 'fast-ethernet', 100, 'up', 'down', 5, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(86, 149, 'Fa0/6', 'fast-ethernet', 100, 'up', 'down', 6, NULL, '2025-11-06 17:32:45', '2025-11-06 17:32:45'),
(87, 149, 'Fa0/7', 'fast-ethernet', 100, 'up', 'down', 7, NULL, '2025-11-06 17:32:46', '2025-11-06 17:32:46'),
(88, 149, 'Fa0/8', 'fast-ethernet', 100, 'up', 'down', 8, NULL, '2025-11-06 17:32:46', '2025-11-06 17:32:46'),
(89, 149, 'Fa0/9', 'fast-ethernet', 100, 'up', 'down', 9, NULL, '2025-11-06 17:32:46', '2025-11-06 17:32:46'),
(90, 149, 'Fa0/10', 'fast-ethernet', 100, 'up', 'down', 10, NULL, '2025-11-06 17:32:46', '2025-11-06 17:32:46'),
(91, 150, 'Fa0/1', 'fast-ethernet', 100, 'up', 'down', 1, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(92, 150, 'Fa0/2', 'fast-ethernet', 100, 'up', 'down', 2, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(93, 150, 'Fa0/3', 'fast-ethernet', 100, 'up', 'down', 3, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(94, 150, 'Fa0/4', 'fast-ethernet', 100, 'up', 'down', 4, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(95, 150, 'Fa0/5', 'fast-ethernet', 100, 'up', 'down', 5, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(96, 150, 'Fa0/6', 'fast-ethernet', 100, 'up', 'down', 6, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(97, 150, 'Fa0/7', 'fast-ethernet', 100, 'up', 'down', 7, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(98, 150, 'Fa0/8', 'fast-ethernet', 100, 'up', 'down', 8, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(99, 150, 'Fa0/9', 'fast-ethernet', 100, 'up', 'down', 9, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(100, 150, 'Fa0/10', 'fast-ethernet', 100, 'up', 'down', 10, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(101, 150, 'Fa0/11', 'fast-ethernet', 100, 'up', 'down', 11, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(102, 150, 'Fa0/12', 'fast-ethernet', 100, 'up', 'down', 12, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(103, 150, 'Fa0/13', 'fast-ethernet', 100, 'up', 'down', 13, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(104, 150, 'Fa0/14', 'fast-ethernet', 100, 'up', 'down', 14, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(105, 150, 'Fa0/15', 'fast-ethernet', 100, 'up', 'down', 15, NULL, '2025-11-06 17:41:58', '2025-11-06 17:41:58'),
(106, 151, 'Gi0/1', 'gigabit-ethernet', 1000, 'up', 'down', 1, NULL, '2025-11-07 14:15:08', '2025-11-07 14:15:08'),
(107, 151, 'Gi0/2', 'gigabit-ethernet', 1000, 'up', 'down', 2, NULL, '2025-11-07 14:15:08', '2025-11-07 14:15:08'),
(108, 151, 'Gi0/3', 'gigabit-ethernet', 1000, 'up', 'down', 3, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(109, 151, 'Gi0/4', 'gigabit-ethernet', 1000, 'up', 'down', 4, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(110, 151, 'Gi0/5', 'gigabit-ethernet', 1000, 'up', 'down', 5, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(111, 151, 'Gi0/6', 'gigabit-ethernet', 1000, 'up', 'down', 6, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(112, 151, 'Gi0/7', 'gigabit-ethernet', 1000, 'up', 'down', 7, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(113, 151, 'Gi0/8', 'gigabit-ethernet', 1000, 'up', 'down', 8, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(114, 151, 'Gi0/9', 'gigabit-ethernet', 1000, 'up', 'down', 9, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09'),
(115, 151, 'Gi0/10', 'gigabit-ethernet', 1000, 'up', 'down', 10, NULL, '2025-11-07 14:15:09', '2025-11-07 14:15:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `permissions`) VALUES
(1, 'admin', NULL),
(2, 'normal', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(11) NOT NULL,
  `jti` varchar(128) NOT NULL,
  `refresh_hash` varchar(128) NOT NULL,
  `ip` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sites`
--

CREATE TABLE `sites` (
  `id` int(11) NOT NULL,
  `network_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sites`
--

INSERT INTO `sites` (`id`, `network_id`, `parent_id`, `name`, `description`, `created_at`) VALUES
(1, 1, NULL, 'Sede Principal', 'Ubicación central', '2025-11-06 17:10:50'),
(2, 1, 1, 'Sucursal Norte', 'Zona norte', '2025-11-06 17:10:50'),
(3, 1, 1, 'Sucursal Sur', 'Zona sur', '2025-11-06 17:10:50'),
(4, 1, 2, 'Sub-sede Mezzanote', NULL, '2025-11-06 18:21:19');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) NOT NULL,
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role_id`, `status`, `last_login`, `created_at`, `updated_at`, `is_active`) VALUES
(1, 'admin', 'admin@local', '$2b$10$xBCl/od4qYezgJ939oUcK.qfW/h2vr.dKZJBXfAuvRxi6rxWc/Rw.', 1, 'active', '2025-11-07 14:11:51', '2025-10-14 17:51:23', '2025-11-07 14:11:51', 1),
(3, 'normal', 'normal@local', '$2b$10$vJNZ4QVQyem5iZ/Xs5DiyuuW.Qnz22ZpiaUDswy9FlWnswleZvm0O', 2, 'active', '2025-10-31 14:34:05', '2025-10-22 14:03:03', '2025-10-31 14:34:05', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_locks`
--

CREATE TABLE `user_locks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `until` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `view_backgrounds`
--

CREATE TABLE `view_backgrounds` (
  `id` int(11) NOT NULL,
  `network_id` int(11) NOT NULL,
  `view` enum('wifi','switch') NOT NULL,
  `image_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `connections`
--
ALTER TABLE `connections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conn_pair` (`network_id`,`from_id_norm`,`to_id_norm`),
  ADD KEY `fk_conn_from` (`from_device_id`),
  ADD KEY `fk_conn_to` (`to_device_id`),
  ADD KEY `idx_conn_network` (`network_id`),
  ADD KEY `fk_conn_a_port` (`a_port_id`),
  ADD KEY `fk_conn_b_port` (`b_port_id`);

--
-- Indices de la tabla `devices`
--
ALTER TABLE `devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_devices_image` (`image_id`),
  ADD KEY `idx_devices_network` (`network_id`),
  ADD KEY `idx_devices_type` (`device_type`),
  ADD KEY `idx_devices_ip` (`ip_address`),
  ADD KEY `idx_devices_mac` (`mac_address`),
  ADD KEY `fk_devices_site` (`site_id`);

--
-- Indices de la tabla `device_positions`
--
ALTER TABLE `device_positions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_device_view` (`device_id`,`view`);

--
-- Indices de la tabla `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_login_user_time` (`user_id`,`created_at`),
  ADD KEY `idx_login_username_time` (`username`,`created_at`),
  ADD KEY `idx_login_ip_time` (`ip`,`created_at`);

--
-- Indices de la tabla `networks`
--
ALTER TABLE `networks`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ping_logs`
--
ALTER TABLE `ping_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ping_device_time` (`device_id`,`ran_at`);

--
-- Indices de la tabla `ports`
--
ALTER TABLE `ports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_device_port_name` (`device_id`,`name`),
  ADD KEY `idx_port_device` (`device_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_jti` (`jti`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indices de la tabla `sites`
--
ALTER TABLE `sites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sites_network` (`network_id`),
  ADD KEY `fk_sites_parent` (`parent_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- Indices de la tabla `user_locks`
--
ALTER TABLE `user_locks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_locks_user_until` (`user_id`,`until`);

--
-- Indices de la tabla `view_backgrounds`
--
ALTER TABLE `view_backgrounds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_bg` (`network_id`,`view`),
  ADD KEY `fk_bg_image` (`image_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `connections`
--
ALTER TABLE `connections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=245;

--
-- AUTO_INCREMENT de la tabla `devices`
--
ALTER TABLE `devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT de la tabla `device_positions`
--
ALTER TABLE `device_positions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `images`
--
ALTER TABLE `images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `login_attempts`
--
ALTER TABLE `login_attempts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT de la tabla `networks`
--
ALTER TABLE `networks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `ping_logs`
--
ALTER TABLE `ping_logs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ports`
--
ALTER TABLE `ports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `sessions`
--
ALTER TABLE `sessions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `sites`
--
ALTER TABLE `sites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `user_locks`
--
ALTER TABLE `user_locks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `view_backgrounds`
--
ALTER TABLE `view_backgrounds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `connections`
--
ALTER TABLE `connections`
  ADD CONSTRAINT `fk_conn_a_port` FOREIGN KEY (`a_port_id`) REFERENCES `ports` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conn_b_port` FOREIGN KEY (`b_port_id`) REFERENCES `ports` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_conn_from` FOREIGN KEY (`from_device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conn_network` FOREIGN KEY (`network_id`) REFERENCES `networks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conn_to` FOREIGN KEY (`to_device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `devices`
--
ALTER TABLE `devices`
  ADD CONSTRAINT `fk_devices_image` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_devices_network` FOREIGN KEY (`network_id`) REFERENCES `networks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_devices_site` FOREIGN KEY (`site_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `device_positions`
--
ALTER TABLE `device_positions`
  ADD CONSTRAINT `fk_pos_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `login_attempts`
--
ALTER TABLE `login_attempts`
  ADD CONSTRAINT `fk_login_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `ping_logs`
--
ALTER TABLE `ping_logs`
  ADD CONSTRAINT `fk_ping_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ports`
--
ALTER TABLE `ports`
  ADD CONSTRAINT `fk_port_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `sites`
--
ALTER TABLE `sites`
  ADD CONSTRAINT `fk_sites_network` FOREIGN KEY (`network_id`) REFERENCES `networks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sites_parent` FOREIGN KEY (`parent_id`) REFERENCES `sites` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);

--
-- Filtros para la tabla `user_locks`
--
ALTER TABLE `user_locks`
  ADD CONSTRAINT `fk_user_locks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `view_backgrounds`
--
ALTER TABLE `view_backgrounds`
  ADD CONSTRAINT `fk_bg_image` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_bg_network` FOREIGN KEY (`network_id`) REFERENCES `networks` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
