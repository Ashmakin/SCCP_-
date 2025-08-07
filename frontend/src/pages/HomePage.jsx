import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

 
import {
    Container,
    Title,
    Text,
    Button,
    Group,
    SimpleGrid,
    Paper,
    ThemeIcon,
    Divider,
} from '@mantine/core';

 
import { IconFileText, IconMessages, IconChartPie } from '@tabler/icons-react';

 
function FeatureCard({ icon, title, description }) {
    return (
        <Paper withBorder radius="md" p="lg">
            <Group>
                <ThemeIcon size="xl" radius="md" variant="light">
                    {icon}
                </ThemeIcon>
                <Text fw={700} size="lg">{title}</Text>
            </Group>
            <Text size="sm" c="dimmed" mt="sm">
                {description}
            </Text>
        </Paper>
    );
}


function HomePage() {
    const { user } = useAuth(); 

    return (
        <Container size="lg" py="xl">
            { }
            <Paper style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'transparent' }}>
                <Title order={1} style={{ fontSize: '3rem' }}>
                    Intelligent Supply Chain,
                    <Text
                        component="span"
                        variant="gradient"
                        gradient={{ from: 'indigo', to: 'cyan' }}
                        inherit
                        ml="sm"
                    >
                        Seamless Collaboration
                    </Text>
                </Title>

                <Text c="dimmed" mt="lg" size="xl" maw={600} mx="auto">
                    Connect with verified suppliers, manage your RFQs, and streamline your procurement process from start to finish on a single, powerful platform.
                </Text>

                { }
                <Group justify="center" mt="xl">
                    {user ? (
                        <Button component={Link} to="/dashboard" size="lg">
                            Go to Your Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button component={Link} to="/register" size="lg">
                                Get Started
                            </Button>
                            <Button component={Link} to="/login" variant="default" size="lg">
                                Sign In
                            </Button>
                        </>
                    )}
                </Group>
            </Paper>

            <Divider my="xl" label="Platform Features" labelPosition="center" />

            { }
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
                <FeatureCard
                    icon={<IconFileText size={28} />}
                    title="Streamlined RFQ Process"
                    description="Easily create and manage Requests for Quotation with file attachments. Receive and compare quotes from multiple suppliers in one place."
                />
                <FeatureCard
                    icon={<IconMessages size={28} />}
                    title="Real-time Collaboration"
                    description="Communicate with suppliers directly within the context of an RFQ using our real-time chat, ensuring all clarifications are documented."
                />
                <FeatureCard
                    icon={<IconChartPie size={28} />}
                    title="Data-Driven Insights"
                    description="Leverage analytics dashboards to track your spending, evaluate supplier performance, and make smarter procurement decisions."
                />
            </SimpleGrid>
        </Container>
    );
}

export default HomePage;